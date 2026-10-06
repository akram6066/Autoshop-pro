BEGIN;

-- ==============================================================================
-- 20261003120000_flexible_locations_and_transfers.sql
-- Implements flexible Locations by expanding 'rooms'. 
-- Decouples stock from products directly into inventory_levels.
-- ==============================================================================

-- 1. Relax products.room_id to support products living in multiple locations
ALTER TABLE public.products ALTER COLUMN room_id DROP NOT NULL;

-- 2. Create inventory_levels as the new source of truth for stock per location
CREATE TABLE public.inventory_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock integer NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shop_id, room_id, product_id, variant_id)
);

CREATE INDEX idx_inventory_levels_shop_room ON public.inventory_levels(shop_id, room_id);
CREATE INDEX idx_inventory_levels_product ON public.inventory_levels(product_id);

ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop members can view inventory levels"
  ON public.inventory_levels FOR SELECT
  USING (shop_id = public.auth_shop_id());

CREATE POLICY "shop members can manage inventory levels"
  ON public.inventory_levels FOR ALL
  USING (shop_id = public.auth_shop_id());

-- 3. Create stock_transfers tables
CREATE TABLE public.stock_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  to_shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  from_room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  to_room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  transfer_date timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_transfers_from_shop ON public.stock_transfers(from_shop_id);
CREATE INDEX idx_stock_transfers_to_shop ON public.stock_transfers(to_shop_id);

ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop members can view stock transfers"
  ON public.stock_transfers FOR SELECT
  USING (from_shop_id = public.auth_shop_id() OR to_shop_id = public.auth_shop_id());

CREATE POLICY "shop members can insert stock transfers"
  ON public.stock_transfers FOR INSERT
  WITH CHECK (from_shop_id = public.auth_shop_id() OR to_shop_id = public.auth_shop_id());

CREATE TABLE public.stock_transfer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0)
);

CREATE INDEX idx_stock_transfer_items_transfer ON public.stock_transfer_items(transfer_id);

ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop members can view transfer items"
  ON public.stock_transfer_items FOR SELECT
  USING (
    transfer_id IN (
      SELECT id FROM public.stock_transfers 
      WHERE from_shop_id = public.auth_shop_id() OR to_shop_id = public.auth_shop_id()
    )
  );

CREATE POLICY "shop members can insert transfer items"
  ON public.stock_transfer_items FOR INSERT
  WITH CHECK (
    transfer_id IN (
      SELECT id FROM public.stock_transfers 
      WHERE from_shop_id = public.auth_shop_id() OR to_shop_id = public.auth_shop_id()
    )
  );

-- 4. Initial Data Migration
-- Migrate product stock
INSERT INTO public.inventory_levels (shop_id, room_id, product_id, variant_id, quantity, min_stock)
SELECT shop_id, room_id, id, NULL, quantity, min_stock 
FROM public.products 
WHERE room_id IS NOT NULL;

-- Migrate variant stock (use the parent product's room_id)
INSERT INTO public.inventory_levels (shop_id, room_id, product_id, variant_id, quantity, min_stock)
SELECT p.shop_id, p.room_id, pv.product_id, pv.id, pv.quantity, pv.min_stock
FROM public.product_variants pv
JOIN public.products p ON p.id = pv.product_id
WHERE p.room_id IS NOT NULL;

-- 5. Backwards Compatibility Triggers
-- A: When products.quantity is updated (legacy write), update inventory_levels
CREATE OR REPLACE FUNCTION public.sync_product_to_inventory() RETURNS trigger AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  
  IF TG_OP = 'UPDATE' AND NEW.quantity <> OLD.quantity AND NEW.room_id IS NOT NULL THEN
    UPDATE public.inventory_levels
    SET quantity = quantity + (NEW.quantity - OLD.quantity)
    WHERE product_id = NEW.id AND variant_id IS NULL AND room_id = NEW.room_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_product_to_inventory
  AFTER UPDATE OF quantity ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.sync_product_to_inventory();

-- B: When product_variants.quantity is updated (legacy write), update inventory_levels
CREATE OR REPLACE FUNCTION public.sync_variant_to_inventory() RETURNS trigger AS $$
DECLARE
  v_room_id uuid;
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;

  IF TG_OP = 'UPDATE' AND NEW.quantity <> OLD.quantity THEN
    SELECT room_id INTO v_room_id FROM public.products WHERE id = NEW.product_id;
    IF v_room_id IS NOT NULL THEN
      UPDATE public.inventory_levels
      SET quantity = quantity + (NEW.quantity - OLD.quantity)
      WHERE product_id = NEW.product_id AND variant_id = NEW.id AND room_id = v_room_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_variant_to_inventory
  AFTER UPDATE OF quantity ON public.product_variants
  FOR EACH ROW EXECUTE PROCEDURE public.sync_variant_to_inventory();

-- C: When inventory_levels is updated (modern write), update aggregate products/variants
CREATE OR REPLACE FUNCTION public.sync_inventory_to_legacy() RETURNS trigger AS $$
DECLARE
  v_delta integer;
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    v_delta := NEW.quantity;
  ELSIF TG_OP = 'UPDATE' THEN
    v_delta := NEW.quantity - OLD.quantity;
  ELSIF TG_OP = 'DELETE' THEN
    v_delta := -OLD.quantity;
  END IF;

  IF v_delta <> 0 THEN
    IF TG_OP = 'DELETE' THEN
      IF OLD.variant_id IS NOT NULL THEN
        UPDATE public.product_variants SET quantity = quantity + v_delta WHERE id = OLD.variant_id;
      ELSE
        UPDATE public.products SET quantity = quantity + v_delta WHERE id = OLD.product_id;
      END IF;
    ELSE
      IF NEW.variant_id IS NOT NULL THEN
        UPDATE public.product_variants SET quantity = quantity + v_delta WHERE id = NEW.variant_id;
      ELSE
        UPDATE public.products SET quantity = quantity + v_delta WHERE id = NEW.product_id;
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_inventory_to_legacy
  AFTER INSERT OR UPDATE OF quantity OR DELETE ON public.inventory_levels
  FOR EACH ROW EXECUTE PROCEDURE public.sync_inventory_to_legacy();


-- 6. Inter-Shop Location Transfer RPC
CREATE OR REPLACE FUNCTION public.transfer_location(
  p_room_id uuid,
  p_from_shop_id uuid,
  p_to_shop_id uuid,
  p_move_stock boolean
) RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_transfer_id uuid;
  v_level RECORD;
  v_new_product_id uuid;
  v_new_variant_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  -- Verify owner role in BOTH shops
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members WHERE shop_id = p_from_shop_id AND user_id = v_user_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Not authorized as owner for source shop' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members WHERE shop_id = p_to_shop_id AND user_id = v_user_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Not authorized as owner for destination shop' USING ERRCODE = '42501';
  END IF;

  -- Ensure room belongs to from_shop
  IF NOT EXISTS (SELECT 1 FROM public.rooms WHERE id = p_room_id AND shop_id = p_from_shop_id) THEN
    RAISE EXCEPTION 'Location not found in source shop';
  END IF;

  IF p_move_stock THEN
    v_transfer_id := gen_random_uuid();
    
    INSERT INTO public.stock_transfers (id, from_shop_id, to_shop_id, from_room_id, to_room_id, user_id, reason)
    VALUES (v_transfer_id, p_from_shop_id, p_to_shop_id, p_room_id, p_room_id, v_user_id, 'Location transfer between shops');

    FOR v_level IN 
      SELECT il.*, p.sku, p.name, p.category, p.price, pv.size, pv.sku as variant_sku, pv.price as variant_price
      FROM public.inventory_levels il
      JOIN public.products p ON p.id = il.product_id
      LEFT JOIN public.product_variants pv ON pv.id = il.variant_id
      WHERE il.room_id = p_room_id AND il.quantity > 0
    LOOP
      -- Match product by SKU in destination shop
      SELECT id INTO v_new_product_id FROM public.products WHERE shop_id = p_to_shop_id AND sku = v_level.sku LIMIT 1;
      
      IF v_new_product_id IS NULL THEN
        v_new_product_id := gen_random_uuid();
        -- Insert without quantity, our trigger will handle updating it when inventory_level moves
        INSERT INTO public.products (id, shop_id, room_id, name, sku, category, price, quantity)
        VALUES (v_new_product_id, p_to_shop_id, p_room_id, v_level.name, v_level.sku, v_level.category, v_level.price, 0);
      END IF;

      -- Handle variants
      IF v_level.variant_id IS NOT NULL THEN
        SELECT id INTO v_new_variant_id FROM public.product_variants WHERE product_id = v_new_product_id AND size = v_level.size LIMIT 1;
        IF v_new_variant_id IS NULL THEN
          v_new_variant_id := gen_random_uuid();
          INSERT INTO public.product_variants (id, product_id, size, sku, price, quantity)
          VALUES (v_new_variant_id, v_new_product_id, v_level.size, v_level.variant_sku, v_level.variant_price, 0);
        END IF;
      ELSE
        v_new_variant_id := NULL;
      END IF;

      -- Update the inventory level to point to the new shop, product, and variant
      -- NOTE: because we change shop_id and product_id, we need to manually adjust the aggregate
      -- to avoid the UPDATE trigger from subtracting from the wrong place.
      -- The trigger sync_inventory_to_legacy uses OLD.quantity and NEW.quantity but assumes the product didn't change!
      -- Actually, our trigger just uses NEW.product_id and OLD.product_id correctly?
      -- Wait, let's just do it directly.
      
      -- 1. Deduct from OLD
      IF v_level.variant_id IS NOT NULL THEN
        UPDATE public.product_variants SET quantity = quantity - v_level.quantity WHERE id = v_level.variant_id;
      ELSE
        UPDATE public.products SET quantity = quantity - v_level.quantity WHERE id = v_level.product_id;
      END IF;

      -- 2. Delete old inventory level, insert new one (safer for triggers)
      DELETE FROM public.inventory_levels WHERE id = v_level.id;
      
      INSERT INTO public.inventory_levels (shop_id, room_id, product_id, variant_id, quantity, min_stock)
      VALUES (p_to_shop_id, p_room_id, v_new_product_id, v_new_variant_id, v_level.quantity, v_level.min_stock);

      -- Record transfer items
      INSERT INTO public.stock_transfer_items (transfer_id, product_id, variant_id, quantity)
      VALUES (v_transfer_id, v_new_product_id, v_new_variant_id, v_level.quantity);
    END LOOP;
  ELSE
    -- If not moving stock, wipe out inventory levels in this room
    DELETE FROM public.inventory_levels WHERE room_id = p_room_id;
  END IF;

  -- Transfer the room itself
  UPDATE public.rooms SET shop_id = p_to_shop_id WHERE id = p_room_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. Inter-Location Stock Transfer RPC
CREATE OR REPLACE FUNCTION public.transfer_stock_between_locations(
  p_transfer_id uuid,
  p_shop_id uuid,
  p_from_room_id uuid,
  p_to_room_id uuid,
  p_reason text,
  p_items jsonb
) RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_qty integer;
  v_source_qty integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthenticated'; END IF;

  IF EXISTS (SELECT 1 FROM public.stock_transfers WHERE id = p_transfer_id) THEN
    RETURN p_transfer_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = p_shop_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.stock_transfers (id, from_shop_id, to_shop_id, from_room_id, to_room_id, user_id, reason)
  VALUES (p_transfer_id, p_shop_id, p_shop_id, p_from_room_id, p_to_room_id, v_user_id, p_reason);

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_variant_id := NULLIF(v_item->>'variant_id', '')::uuid;
    v_qty := (v_item->>'quantity')::integer;

    -- Verify stock
    SELECT quantity INTO v_source_qty FROM public.inventory_levels 
    WHERE shop_id = p_shop_id AND room_id = p_from_room_id 
      AND product_id = v_product_id AND (variant_id = v_variant_id OR (variant_id IS NULL AND v_variant_id IS NULL))
    FOR UPDATE;

    IF v_source_qty IS NULL OR v_source_qty < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock in source location for product %', v_product_id;
    END IF;

    -- Deduct from source
    UPDATE public.inventory_levels SET quantity = quantity - v_qty
    WHERE shop_id = p_shop_id AND room_id = p_from_room_id 
      AND product_id = v_product_id AND (variant_id = v_variant_id OR (variant_id IS NULL AND v_variant_id IS NULL));

    -- Add to destination (creates if not exists)
    INSERT INTO public.inventory_levels (shop_id, room_id, product_id, variant_id, quantity)
    VALUES (p_shop_id, p_to_room_id, v_product_id, v_variant_id, v_qty)
    ON CONFLICT (shop_id, room_id, product_id, variant_id) 
    DO UPDATE SET quantity = public.inventory_levels.quantity + EXCLUDED.quantity;

    INSERT INTO public.stock_transfer_items (transfer_id, product_id, variant_id, quantity)
    VALUES (p_transfer_id, v_product_id, v_variant_id, v_qty);
  END LOOP;

  RETURN p_transfer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
