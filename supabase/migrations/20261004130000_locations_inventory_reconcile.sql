-- ==============================================================================
-- 20261004130000_locations_inventory_reconcile.sql
--
-- Reconciles the Locations / Transfers schema. Safe to run on:
--   (a) a fresh database (after 20261003120000 + 20261003130000), and
--   (b) production, where those migrations were applied partially / patched by hand.
--
-- Design (Expand & Contract, see GEMINI.md §7):
--   * products.quantity / product_variants.quantity stay the stock TOTAL that
--     record_sale, void_sale, adjustments and POs already use (untouched).
--   * inventory_levels is the per-location BREAKDOWN of that total.
--   * Sync is strictly ONE-WAY: total changes -> levels (triggers below).
--     Levels never write back to totals, so there are no trigger loops.
--   * Moving stock inside a shop only touches levels (total unchanged).
--   * All transfers go through public.transfer_stock(): atomic, idempotent
--     (client-supplied UUID), authorised via shop_members, and audited.
--
-- NOTE: no BEGIN/COMMIT here on purpose. The CLI already wraps the file; an
-- inner COMMIT is what made the earlier rollback file persist by accident.
-- ==============================================================================

-- ─── 0. Remove the legacy two-way triggers/RPCs FIRST ─────────────────────────
-- Must happen before any DML on inventory_levels, otherwise the old
-- levels->totals trigger would mutate products.quantity during the rebuild.
DROP TRIGGER IF EXISTS trg_sync_inventory_to_legacy ON public.inventory_levels;
DROP TRIGGER IF EXISTS trg_sync_variant_to_inventory ON public.product_variants;
DROP TRIGGER IF EXISTS trg_sync_product_to_inventory ON public.products;
DROP FUNCTION IF EXISTS public.sync_inventory_to_legacy();
DROP FUNCTION IF EXISTS public.sync_variant_to_inventory();
DROP FUNCTION IF EXISTS public.sync_product_to_inventory();
DROP FUNCTION IF EXISTS public.transfer_location(uuid, uuid, uuid, boolean);
DROP FUNCTION IF EXISTS public.transfer_stock_between_locations(uuid, uuid, uuid, uuid, text, jsonb);
DROP FUNCTION IF EXISTS public.execute_inventory_transfer(uuid, uuid, uuid, uuid, integer);

-- ─── 1. Tables (create if the manual patch never ran) ─────────────────────────
-- products.room_id now means "primary location"; nullable keeps both paths equal.
ALTER TABLE public.products ALTER COLUMN room_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.inventory_levels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  room_id     uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id  uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity    integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock   integer NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id            uuid PRIMARY KEY,  -- client-supplied => idempotent replays
  from_shop_id  uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  to_shop_id    uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  from_room_id  uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  to_room_id    uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  transfer_date timestamptz NOT NULL DEFAULT now(),
  reason        text NOT NULL,
  status        text NOT NULL DEFAULT 'completed',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id  uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity    integer NOT NULL CHECK (quantity > 0)
);

-- History must survive renames / deletes of shops, locations and products,
-- so snapshot the human-readable names on the record itself.
ALTER TABLE public.stock_transfers
  ADD COLUMN IF NOT EXISTS from_shop_name text,
  ADD COLUMN IF NOT EXISTS to_shop_name   text,
  ADD COLUMN IF NOT EXISTS from_room_name text,
  ADD COLUMN IF NOT EXISTS to_room_name   text;

ALTER TABLE public.stock_transfer_items
  ADD COLUMN IF NOT EXISTS dest_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dest_variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_name    text,
  ADD COLUMN IF NOT EXISTS variant_size    text,
  ADD COLUMN IF NOT EXISTS sku             text;

-- Deleting a product must not erase its transfer history (was ON DELETE CASCADE).
ALTER TABLE public.stock_transfer_items ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE public.stock_transfer_items DROP CONSTRAINT IF EXISTS stock_transfer_items_product_id_fkey;
ALTER TABLE public.stock_transfer_items
  ADD CONSTRAINT stock_transfer_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.stock_transfers
  DROP CONSTRAINT IF EXISTS stock_transfers_reason_length;
ALTER TABLE public.stock_transfers
  ADD CONSTRAINT stock_transfers_reason_length CHECK (char_length(reason) <= 500);

-- ─── 2. Security: RLS ON, read-only for clients, writes only via RPC ──────────
ALTER TABLE public.inventory_levels     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop members can view inventory levels"   ON public.inventory_levels;
DROP POLICY IF EXISTS "shop members can manage inventory levels" ON public.inventory_levels;
DROP POLICY IF EXISTS "shop members can view stock transfers"    ON public.stock_transfers;
DROP POLICY IF EXISTS "shop members can insert stock transfers"  ON public.stock_transfers;
DROP POLICY IF EXISTS "shop members can view transfer items"     ON public.stock_transfer_items;
DROP POLICY IF EXISTS "shop members can insert transfer items"   ON public.stock_transfer_items;
DROP POLICY IF EXISTS "members_select_inventory_levels"          ON public.inventory_levels;
DROP POLICY IF EXISTS "members_select_stock_transfers"           ON public.stock_transfers;
DROP POLICY IF EXISTS "members_select_stock_transfer_items"      ON public.stock_transfer_items;

CREATE POLICY "members_select_inventory_levels" ON public.inventory_levels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shop_members sm
      WHERE sm.shop_id = inventory_levels.shop_id AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "members_select_stock_transfers" ON public.stock_transfers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shop_members sm
      WHERE sm.user_id = auth.uid()
        AND sm.shop_id IN (stock_transfers.from_shop_id, stock_transfers.to_shop_id)
    )
  );

CREATE POLICY "members_select_stock_transfer_items" ON public.stock_transfer_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.stock_transfers st
      JOIN public.shop_members sm
        ON sm.user_id = auth.uid()
       AND sm.shop_id IN (st.from_shop_id, st.to_shop_id)
      WHERE st.id = stock_transfer_items.transfer_id
    )
  );

REVOKE ALL ON public.inventory_levels, public.stock_transfers, public.stock_transfer_items FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.inventory_levels, public.stock_transfers, public.stock_transfer_items FROM authenticated;

-- ─── 3. Uniqueness + indexes ──────────────────────────────────────────────────
-- A plain UNIQUE(.., variant_id) treats NULLs as distinct, so non-variant rows
-- could be duplicated. Remove any duplicates, then enforce with COALESCE.
DELETE FROM public.inventory_levels a
USING public.inventory_levels b
WHERE a.id > b.id
  AND a.room_id = b.room_id
  AND a.product_id = b.product_id
  AND a.variant_id IS NOT DISTINCT FROM b.variant_id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_levels_location_item
  ON public.inventory_levels (room_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX IF NOT EXISTS idx_inventory_levels_shop_room ON public.inventory_levels (shop_id, room_id);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_product   ON public.inventory_levels (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_from_shop  ON public.stock_transfers (from_shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_to_shop    ON public.stock_transfers (to_shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_transfer ON public.stock_transfer_items (transfer_id);

-- ─── 4. Internal helpers (not callable by clients) ────────────────────────────
-- Set one row's quantity relatively; create it when missing.
CREATE OR REPLACE FUNCTION public.adjust_inventory_level(
  p_shop_id uuid, p_room_id uuid, p_product_id uuid, p_variant_id uuid, p_delta integer
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.inventory_levels
     SET quantity = quantity + p_delta, updated_at = now()
   WHERE room_id = p_room_id
     AND product_id = p_product_id
     AND variant_id IS NOT DISTINCT FROM p_variant_id;

  IF NOT FOUND THEN
    IF p_delta < 0 THEN
      RAISE EXCEPTION 'No stock recorded in this location';
    END IF;
    INSERT INTO public.inventory_levels (shop_id, room_id, product_id, variant_id, quantity)
    VALUES (p_shop_id, p_room_id, p_product_id, p_variant_id, p_delta);
  END IF;
END $$;

-- Reflect a change of the stock TOTAL onto the per-location rows.
--   decrease: take from the primary location first, then the largest others
--   increase: add to the primary location (or the largest one if none is set)
CREATE OR REPLACE FUNCTION public.apply_total_delta_to_levels(
  p_shop_id uuid, p_product_id uuid, p_variant_id uuid, p_primary_room uuid, p_delta integer
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_remaining integer;
  v_lvl       record;
  v_take      integer;
  v_target    uuid;
BEGIN
  IF p_delta = 0 THEN RETURN; END IF;

  IF p_delta < 0 THEN
    v_remaining := -p_delta;
    FOR v_lvl IN
      SELECT id, quantity FROM public.inventory_levels
       WHERE product_id = p_product_id
         AND variant_id IS NOT DISTINCT FROM p_variant_id
         AND quantity > 0
       ORDER BY (room_id IS NOT DISTINCT FROM p_primary_room) DESC, quantity DESC, id
       FOR UPDATE
    LOOP
      EXIT WHEN v_remaining <= 0;
      v_take := LEAST(v_lvl.quantity, v_remaining);
      UPDATE public.inventory_levels
         SET quantity = quantity - v_take, updated_at = now()
       WHERE id = v_lvl.id;
      v_remaining := v_remaining - v_take;
    END LOOP;
  ELSE
    v_target := p_primary_room;
    IF v_target IS NULL THEN
      SELECT room_id INTO v_target FROM public.inventory_levels
       WHERE product_id = p_product_id AND variant_id IS NOT DISTINCT FROM p_variant_id
       ORDER BY quantity DESC LIMIT 1;
    END IF;
    IF v_target IS NOT NULL THEN
      PERFORM public.adjust_inventory_level(p_shop_id, v_target, p_product_id, p_variant_id, p_delta);
    END IF;
  END IF;
END $$;

-- Transfers manage levels explicitly, so they flip this transaction-local flag
-- to stop the triggers from also applying the same movement a second time.
CREATE OR REPLACE FUNCTION public.level_sync_suspended() RETURNS boolean
LANGUAGE sql STABLE AS $$ SELECT COALESCE(current_setting('app.skip_level_sync', true), 'off') = 'on' $$;

-- ─── 5. One-way triggers: totals -> levels ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_products_to_levels() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.level_sync_suspended() THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.room_id IS NOT NULL THEN
      PERFORM public.adjust_inventory_level(NEW.shop_id, NEW.room_id, NEW.id, NULL, NEW.quantity);
    END IF;
    RETURN NEW;
  END IF;

  -- Products that have variants keep their stock on the variants.
  IF NEW.quantity <> OLD.quantity
     AND NOT EXISTS (SELECT 1 FROM public.product_variants v WHERE v.product_id = NEW.id) THEN
    PERFORM public.apply_total_delta_to_levels(NEW.shop_id, NEW.id, NULL, NEW.room_id, NEW.quantity - OLD.quantity);
  END IF;

  -- Editing the primary location of a single-location product moves its stock.
  IF NEW.room_id IS DISTINCT FROM OLD.room_id
     AND NEW.room_id IS NOT NULL AND OLD.room_id IS NOT NULL THEN
    UPDATE public.inventory_levels
       SET room_id = NEW.room_id, updated_at = now()
     WHERE product_id = NEW.id
       AND room_id = OLD.room_id
       AND NOT EXISTS (
         SELECT 1 FROM public.inventory_levels o
          WHERE o.product_id = NEW.id AND o.room_id <> OLD.room_id
       );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_products_to_levels ON public.products;
CREATE TRIGGER trg_products_to_levels
  AFTER INSERT OR UPDATE OF quantity, room_id ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.trg_products_to_levels();

CREATE OR REPLACE FUNCTION public.trg_variants_to_levels() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_shop uuid;
  v_room uuid;
BEGIN
  IF public.level_sync_suspended() THEN RETURN NEW; END IF;

  SELECT shop_id, room_id INTO v_shop, v_room FROM public.products WHERE id = NEW.product_id;

  IF TG_OP = 'INSERT' THEN
    -- Once a product has variants its own (non-variant) level row is obsolete.
    DELETE FROM public.inventory_levels WHERE product_id = NEW.product_id AND variant_id IS NULL;
    IF v_room IS NOT NULL THEN
      PERFORM public.adjust_inventory_level(v_shop, v_room, NEW.product_id, NEW.id, NEW.quantity);
    END IF;
  ELSIF NEW.quantity <> OLD.quantity THEN
    PERFORM public.apply_total_delta_to_levels(v_shop, NEW.product_id, NEW.id, v_room, NEW.quantity - OLD.quantity);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_variants_to_levels ON public.product_variants;
CREATE TRIGGER trg_variants_to_levels
  AFTER INSERT OR UPDATE OF quantity ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.trg_variants_to_levels();

-- ─── 6. Reconciliation (self-healing, safe to re-run) ─────────────────────────
-- For every product/variant: if the sum of its location rows differs from the
-- total, rebuild its rows as a single row at the primary location. Correct
-- multi-location data (sum == total) is left untouched.
CREATE OR REPLACE FUNCTION public.reconcile_inventory_levels() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_fixed integer := 0;
  v_n     integer;
BEGIN
  -- Obsolete product-level rows for products that use variants.
  DELETE FROM public.inventory_levels il
   WHERE il.variant_id IS NULL
     AND EXISTS (SELECT 1 FROM public.product_variants v WHERE v.product_id = il.product_id);

  -- Products without variants: totals vs rows.
  DELETE FROM public.inventory_levels il
   USING public.products p
   WHERE il.product_id = p.id AND il.variant_id IS NULL
     AND NOT EXISTS (SELECT 1 FROM public.product_variants v WHERE v.product_id = p.id)
     AND COALESCE((SELECT sum(x.quantity) FROM public.inventory_levels x
                    WHERE x.product_id = p.id AND x.variant_id IS NULL), 0) <> p.quantity;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_fixed := v_fixed + v_n;

  INSERT INTO public.inventory_levels (shop_id, room_id, product_id, variant_id, quantity, min_stock)
  SELECT p.shop_id, p.room_id, p.id, NULL, p.quantity, p.min_stock
    FROM public.products p
   WHERE p.room_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.product_variants v WHERE v.product_id = p.id)
     AND NOT EXISTS (SELECT 1 FROM public.inventory_levels x WHERE x.product_id = p.id AND x.variant_id IS NULL);

  -- Variants: totals vs rows.
  DELETE FROM public.inventory_levels il
   USING public.product_variants v
   WHERE il.variant_id = v.id
     AND COALESCE((SELECT sum(x.quantity) FROM public.inventory_levels x WHERE x.variant_id = v.id), 0) <> v.quantity;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_fixed := v_fixed + v_n;

  INSERT INTO public.inventory_levels (shop_id, room_id, product_id, variant_id, quantity, min_stock)
  SELECT p.shop_id, p.room_id, v.product_id, v.id, v.quantity, v.min_stock
    FROM public.product_variants v
    JOIN public.products p ON p.id = v.product_id
   WHERE p.room_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.inventory_levels x WHERE x.variant_id = v.id);

  RETURN v_fixed;
END $$;

REVOKE ALL ON FUNCTION public.adjust_inventory_level(uuid, uuid, uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_total_delta_to_levels(uuid, uuid, uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reconcile_inventory_levels() FROM PUBLIC, anon, authenticated;

SELECT public.reconcile_inventory_levels();

-- ─── 7. transfer_stock: the ONE way to move stock ─────────────────────────────
-- Covers location->location (same shop) and shop->shop (any locations).
-- p_from_room_id NULL => the product's primary location.
CREATE OR REPLACE FUNCTION public.transfer_stock(
  p_transfer_id       uuid,
  p_source_product_id uuid,
  p_variant_id        uuid,
  p_from_room_id      uuid,
  p_dest_shop_id      uuid,
  p_dest_room_id      uuid,
  p_quantity          integer,
  p_reason            text DEFAULT NULL,
  p_transfer_date     timestamptz DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user          uuid := auth.uid();
  v_reason        text;
  v_date          timestamptz := COALESCE(p_transfer_date, now());
  v_existing_shop uuid;
  v_result        uuid;

  v_src_shop      uuid;
  v_src_room      uuid;
  v_sku           text;
  v_name          text;
  v_category      text;
  v_min_stock     integer;
  v_price         numeric(12,2);
  v_size          text;
  v_prod_qty      integer;
  v_has_variants  boolean;

  v_var_size      text;
  v_var_sku       text;
  v_var_price     numeric(12,2);
  v_var_min       integer;
  v_var_qty       integer;

  v_src_shop_name text;
  v_dst_shop_name text;
  v_src_room_name text;
  v_dst_room_name text;

  v_level_qty     integer;
  v_dest_product  uuid;
  v_dest_variant  uuid;
  v_dest_qty      integer;
  v_src_after     integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;
  IF p_transfer_id IS NULL THEN
    RAISE EXCEPTION 'A transfer id is required';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Transfer quantity must be greater than 0';
  END IF;

  v_reason := COALESCE(NULLIF(btrim(p_reason), ''), 'Stock transfer');
  IF char_length(v_reason) > 500 THEN
    RAISE EXCEPTION 'Reason is too long (max 500 characters)';
  END IF;

  -- Idempotent replay: same id => return the original result, change nothing.
  SELECT from_shop_id INTO v_existing_shop FROM public.stock_transfers WHERE id = p_transfer_id;
  IF FOUND THEN
    IF NOT EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = v_existing_shop AND user_id = v_user) THEN
      RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
    END IF;
    SELECT COALESCE(dest_product_id, product_id) INTO v_result
      FROM public.stock_transfer_items WHERE transfer_id = p_transfer_id LIMIT 1;
    RETURN v_result;
  END IF;

  -- Lock the source product row: serialises against sales and other transfers.
  SELECT shop_id, room_id, sku, name, category, min_stock, price, size, quantity
    INTO v_src_shop, v_src_room, v_sku, v_name, v_category, v_min_stock, v_price, v_size, v_prod_qty
    FROM public.products WHERE id = p_source_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source product not found';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = v_src_shop AND user_id = v_user) THEN
    RAISE EXCEPTION 'Not authorized for source shop' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = p_dest_shop_id AND user_id = v_user) THEN
    RAISE EXCEPTION 'Not authorized for destination shop' USING ERRCODE = '42501';
  END IF;

  -- Both locations must belong to the shop they are used in (tenant isolation).
  v_src_room := COALESCE(p_from_room_id, v_src_room);
  IF v_src_room IS NULL THEN
    RAISE EXCEPTION 'Choose the location to transfer from';
  END IF;
  SELECT name INTO v_src_room_name FROM public.rooms WHERE id = v_src_room AND shop_id = v_src_shop;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source location does not belong to the source shop';
  END IF;
  SELECT name INTO v_dst_room_name FROM public.rooms WHERE id = p_dest_room_id AND shop_id = p_dest_shop_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Destination location does not belong to the destination shop';
  END IF;

  IF v_src_shop = p_dest_shop_id AND v_src_room = p_dest_room_id THEN
    RAISE EXCEPTION 'Source and destination location are the same';
  END IF;

  SELECT name INTO v_src_shop_name FROM public.shops WHERE id = v_src_shop;
  SELECT name INTO v_dst_shop_name FROM public.shops WHERE id = p_dest_shop_id;

  v_has_variants := EXISTS (SELECT 1 FROM public.product_variants WHERE product_id = p_source_product_id);

  IF p_variant_id IS NOT NULL THEN
    SELECT size, sku, price, min_stock, quantity
      INTO v_var_size, v_var_sku, v_var_price, v_var_min, v_var_qty
      FROM public.product_variants
     WHERE id = p_variant_id AND product_id = p_source_product_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant not found for this product';
    END IF;
  ELSIF v_has_variants THEN
    RAISE EXCEPTION 'Choose which variant to transfer';
  END IF;

  -- The chosen LOCATION must hold enough (not just the shop total).
  SELECT quantity INTO v_level_qty FROM public.inventory_levels
   WHERE room_id = v_src_room AND product_id = p_source_product_id
     AND variant_id IS NOT DISTINCT FROM p_variant_id
   FOR UPDATE;
  IF v_level_qty IS NULL OR v_level_qty < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock in "%" (available: %)', v_src_room_name, COALESCE(v_level_qty, 0);
  END IF;

  INSERT INTO public.stock_transfers (
    id, from_shop_id, to_shop_id, from_room_id, to_room_id, user_id, reason, transfer_date,
    from_shop_name, to_shop_name, from_room_name, to_room_name
  ) VALUES (
    p_transfer_id, v_src_shop, p_dest_shop_id, v_src_room, p_dest_room_id, v_user, v_reason, v_date,
    v_src_shop_name, v_dst_shop_name, v_src_room_name, v_dst_room_name
  );

  IF v_src_shop = p_dest_shop_id THEN
    -- ── Location -> location inside one shop: totals unchanged, only rows move ─
    PERFORM public.adjust_inventory_level(v_src_shop, v_src_room,     p_source_product_id, p_variant_id, -p_quantity);
    PERFORM public.adjust_inventory_level(v_src_shop, p_dest_room_id, p_source_product_id, p_variant_id,  p_quantity);

    INSERT INTO public.stock_transfer_items (
      transfer_id, product_id, variant_id, dest_product_id, dest_variant_id,
      quantity, product_name, variant_size, sku
    ) VALUES (
      p_transfer_id, p_source_product_id, p_variant_id, p_source_product_id, p_variant_id,
      p_quantity, v_name, v_var_size, COALESCE(v_var_sku, v_sku)
    );
    RETURN p_source_product_id;
  END IF;

  -- ── Shop -> shop: totals move; levels are handled explicitly below ──────────
  PERFORM set_config('app.skip_level_sync', 'on', true);

  SELECT id INTO v_dest_product FROM public.products
   WHERE shop_id = p_dest_shop_id AND sku = v_sku FOR UPDATE;

  IF v_dest_product IS NULL THEN
    INSERT INTO public.products (shop_id, room_id, name, sku, category, quantity, min_stock, price, size)
    VALUES (p_dest_shop_id, p_dest_room_id, v_name, v_sku, v_category, 0, v_min_stock, v_price, v_size)
    RETURNING id INTO v_dest_product;
  ELSIF (p_variant_id IS NOT NULL) <> EXISTS (SELECT 1 FROM public.product_variants WHERE product_id = v_dest_product) THEN
    RAISE EXCEPTION 'Product "%" exists in the destination shop with a different size/variant setup', v_name;
  END IF;

  IF p_variant_id IS NOT NULL THEN
    UPDATE public.product_variants SET quantity = quantity - p_quantity WHERE id = p_variant_id;
    v_src_after := v_var_qty - p_quantity;

    SELECT id, quantity INTO v_dest_variant, v_dest_qty FROM public.product_variants
     WHERE product_id = v_dest_product AND size = v_var_size FOR UPDATE;
    IF v_dest_variant IS NULL THEN
      INSERT INTO public.product_variants (product_id, size, sku, price, quantity, min_stock)
      VALUES (v_dest_product, v_var_size, v_var_sku, v_var_price, 0, v_var_min)
      RETURNING id INTO v_dest_variant;
      v_dest_qty := 0;
    END IF;
    UPDATE public.product_variants SET quantity = quantity + p_quantity WHERE id = v_dest_variant;
  ELSE
    UPDATE public.products SET quantity = quantity - p_quantity, updated_at = now() WHERE id = p_source_product_id;
    v_src_after := v_prod_qty - p_quantity;

    SELECT quantity INTO v_dest_qty FROM public.products WHERE id = v_dest_product;
    UPDATE public.products SET quantity = quantity + p_quantity, updated_at = now() WHERE id = v_dest_product;
  END IF;

  PERFORM public.adjust_inventory_level(v_src_shop,     v_src_room,     p_source_product_id, p_variant_id, -p_quantity);
  PERFORM public.adjust_inventory_level(p_dest_shop_id, p_dest_room_id, v_dest_product,      v_dest_variant, p_quantity);

  INSERT INTO public.stock_movements (shop_id, product_id, variant_id, type, delta, snapshot_qty, device_id, reason, user_id, synced, created_at)
  VALUES (v_src_shop, p_source_product_id, p_variant_id, 'OUT', p_quantity, v_src_after,
          'transfer_to:' || p_dest_shop_id || ':' || p_dest_room_id, 'transfer', v_user, true, v_date);
  INSERT INTO public.stock_movements (shop_id, product_id, variant_id, type, delta, snapshot_qty, device_id, reason, user_id, synced, created_at)
  VALUES (p_dest_shop_id, v_dest_product, v_dest_variant, 'IN', p_quantity, COALESCE(v_dest_qty, 0) + p_quantity,
          'transfer_from:' || v_src_shop || ':' || v_src_room, 'transfer', v_user, true, v_date);

  INSERT INTO public.stock_transfer_items (
    transfer_id, product_id, variant_id, dest_product_id, dest_variant_id,
    quantity, product_name, variant_size, sku
  ) VALUES (
    p_transfer_id, p_source_product_id, p_variant_id, v_dest_product, v_dest_variant,
    p_quantity, v_name, v_var_size, COALESCE(v_var_sku, v_sku)
  );

  INSERT INTO public.shop_notifications (shop_id, title, message)
  VALUES (
    p_dest_shop_id,
    'Incoming Transfer',
    'Received ' || p_quantity || ' units of ' || v_name
      || CASE WHEN COALESCE(v_var_size, '') <> '' THEN ' (Size: ' || v_var_size || ')' ELSE '' END
      || CASE WHEN COALESCE(v_var_sku, v_sku, '') <> '' THEN ' [SKU: ' || COALESCE(v_var_sku, v_sku) || ']' ELSE '' END
      || ' from ' || v_src_shop_name || ' (' || v_src_room_name || ') into ' || v_dst_room_name
      || '. New stock: ' || (COALESCE(v_dest_qty, 0) + p_quantity)
  );

  PERFORM set_config('app.skip_level_sync', 'off', true);
  RETURN v_dest_product;
END $$;

REVOKE ALL ON FUNCTION public.transfer_stock(uuid, uuid, uuid, uuid, uuid, uuid, integer, text, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_stock(uuid, uuid, uuid, uuid, uuid, uuid, integer, text, timestamptz) TO authenticated;

-- ─── 8. preview_stock_transfer: "what will happen" before the user confirms ──
CREATE OR REPLACE FUNCTION public.preview_stock_transfer(
  p_source_product_id uuid,
  p_variant_id        uuid,
  p_from_room_id      uuid,
  p_dest_shop_id      uuid,
  p_dest_room_id      uuid
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user         uuid := auth.uid();
  v_shop         uuid;
  v_room         uuid;
  v_sku          text;
  v_size         text;
  v_available    integer;
  v_dest_product uuid;
  v_dest_variant uuid;
  v_conflict     boolean := false;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  SELECT shop_id, room_id, sku INTO v_shop, v_room, v_sku FROM public.products WHERE id = p_source_product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Source product not found'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = v_shop AND user_id = v_user)
     OR NOT EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = p_dest_shop_id AND user_id = v_user) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  v_room := COALESCE(p_from_room_id, v_room);

  SELECT quantity INTO v_available FROM public.inventory_levels
   WHERE room_id = v_room AND product_id = p_source_product_id
     AND variant_id IS NOT DISTINCT FROM p_variant_id;

  IF v_shop <> p_dest_shop_id THEN
    SELECT id INTO v_dest_product FROM public.products WHERE shop_id = p_dest_shop_id AND sku = v_sku;
    IF v_dest_product IS NOT NULL THEN
      IF p_variant_id IS NOT NULL THEN
        SELECT size INTO v_size FROM public.product_variants WHERE id = p_variant_id;
        SELECT id INTO v_dest_variant FROM public.product_variants WHERE product_id = v_dest_product AND size = v_size;
      END IF;
      v_conflict := (p_variant_id IS NOT NULL) <> EXISTS (SELECT 1 FROM public.product_variants WHERE product_id = v_dest_product);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'available',              COALESCE(v_available, 0),
    'same_shop',              v_shop = p_dest_shop_id,
    'same_location',          v_shop = p_dest_shop_id AND v_room = p_dest_room_id,
    'dest_product_exists',    v_dest_product IS NOT NULL,
    'dest_variant_exists',    v_dest_variant IS NOT NULL,
    'dest_structure_conflict', v_conflict
  );
END $$;

REVOKE ALL ON FUNCTION public.preview_stock_transfer(uuid, uuid, uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preview_stock_transfer(uuid, uuid, uuid, uuid, uuid) TO authenticated;

-- ─── 9. Legacy entry point, kept so stale browser tabs keep working ───────────
CREATE OR REPLACE FUNCTION public.execute_inventory_transfer(
  p_source_product_id uuid,
  p_variant_id        uuid,
  p_dest_shop_id      uuid,
  p_dest_room_id      uuid,
  p_quantity          integer,
  p_transfer_date     timestamptz DEFAULT NULL
) RETURNS uuid
LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT public.transfer_stock(
    gen_random_uuid(), p_source_product_id, p_variant_id, NULL,
    p_dest_shop_id, p_dest_room_id, p_quantity, NULL, p_transfer_date
  );
$$;

REVOKE ALL ON FUNCTION public.execute_inventory_transfer(uuid, uuid, uuid, uuid, integer, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execute_inventory_transfer(uuid, uuid, uuid, uuid, integer, timestamptz) TO authenticated;
