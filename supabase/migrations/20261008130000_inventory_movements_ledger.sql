-- ==============================================================================
-- 20261008130000_inventory_movements_ledger.sql
--
-- Product Activity / Inventory Movement Ledger
--
-- 1. Immutable movement ledger table (public.inventory_movements)
-- 2. Clean separation between Stock Movements and Product Audit Events
-- 3. Atomic, idempotent mutations across Sales, Transfers, Restocks, Adjustments
-- 4. Product archiving & lifecycle support (is_archived, archived_at)
-- 5. Backfill from legacy stock_movements
-- ==============================================================================

-- ─── 1. Product Archiving Support ─────────────────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archive_reason text;

CREATE INDEX IF NOT EXISTS idx_products_shop_archived
  ON public.products (shop_id, is_archived);

-- ─── 2. Inventory Movements Table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id           uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id        uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id        uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  movement_type     text NOT NULL,
  quantity          integer NOT NULL,
  quantity_before   integer,
  quantity_after    integer,
  from_location_id  uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  to_location_id    uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  reference_id      uuid,
  reference_type    text,
  performed_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  reason            text,
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key   text
);

-- Constraint on valid movement types
ALTER TABLE public.inventory_movements
  DROP CONSTRAINT IF EXISTS chk_inventory_movements_type;
ALTER TABLE public.inventory_movements
  ADD CONSTRAINT chk_inventory_movements_type
  CHECK (movement_type IN (
    'RECEIVE',
    'RESTOCK',
    'SALE',
    'SALE_VOID',
    'TRANSFER_OUT',
    'TRANSFER_IN',
    'RETURN',
    'ADJUSTMENT_IN',
    'ADJUSTMENT_OUT',
    'DAMAGE',
    'LOSS',
    'FOUND',
    'INITIAL_STOCK'
  ));

-- ─── 3. Indexes & Constraints ─────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_movements_idempotency
  ON public.inventory_movements (shop_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_shop_prod_created
  ON public.inventory_movements (shop_id, product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_shop_created
  ON public.inventory_movements (shop_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_created
  ON public.inventory_movements (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant_created
  ON public.inventory_movements (variant_id, created_at DESC)
  WHERE variant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_ref
  ON public.inventory_movements (reference_id)
  WHERE reference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_type
  ON public.inventory_movements (shop_id, movement_type);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_from_loc
  ON public.inventory_movements (from_location_id)
  WHERE from_location_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_to_loc
  ON public.inventory_movements (to_location_id)
  WHERE to_location_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_performed_by
  ON public.inventory_movements (performed_by)
  WHERE performed_by IS NOT NULL;

-- ─── 4. RLS & Permissions ─────────────────────────────────────────────────────
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_select_inventory_movements" ON public.inventory_movements;
CREATE POLICY "members_select_inventory_movements" ON public.inventory_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shop_members sm
      WHERE sm.shop_id = inventory_movements.shop_id
        AND sm.user_id = auth.uid()
    )
  );

REVOKE ALL ON public.inventory_movements FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.inventory_movements FROM authenticated;
GRANT SELECT ON public.inventory_movements TO authenticated;

CREATE OR REPLACE FUNCTION public.prevent_inventory_movement_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'inventory_movements is immutable and cannot be updated or deleted'
    USING ERRCODE = '42501';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_inventory_movement_mutation ON public.inventory_movements;
CREATE TRIGGER trg_prevent_inventory_movement_mutation
  BEFORE UPDATE OR DELETE ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_inventory_movement_mutation();


-- ─── 5. Backfill from legacy stock_movements ──────────────────────────────────
INSERT INTO public.inventory_movements (
  id, shop_id, product_id, variant_id, movement_type, quantity,
  quantity_before, quantity_after, performed_by, created_at, reason,
  idempotency_key, metadata
)
SELECT
  sm.id,
  sm.shop_id,
  sm.product_id,
  sm.variant_id,
  CASE
    WHEN sm.reason = 'sale' THEN 'SALE'
    WHEN sm.reason = 'restock' THEN 'RESTOCK'
    WHEN sm.reason = 'transfer' AND sm.type = 'OUT' THEN 'TRANSFER_OUT'
    WHEN sm.reason = 'transfer' AND sm.type = 'IN' THEN 'TRANSFER_IN'
    WHEN sm.type = 'IN' THEN 'ADJUSTMENT_IN'
    ELSE 'ADJUSTMENT_OUT'
  END AS movement_type,
  CASE WHEN sm.type = 'IN' THEN sm.delta ELSE -sm.delta END AS quantity,
  CASE WHEN sm.type = 'IN' THEN sm.snapshot_qty - sm.delta ELSE sm.snapshot_qty + sm.delta END AS quantity_before,
  sm.snapshot_qty AS quantity_after,
  sm.user_id,
  sm.created_at,
  sm.reason::text,
  'legacy:' || sm.id::text,
  jsonb_build_object('legacy', true, 'device_id', sm.device_id)
FROM public.stock_movements sm
ON CONFLICT (id) DO NOTHING;

-- ─── 6. Upgrade Audit Triggers (Detailed Diffs & Lifecycle) ───────────────────
CREATE OR REPLACE FUNCTION public.audit_product_change()
RETURNS TRIGGER AS $$
DECLARE
  v_changes jsonb := '{}'::jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      shop_id, user_id, event_type, entity_type, entity_id, payload, severity
    ) VALUES (
      NEW.shop_id, auth.uid(), 'PRODUCT_CREATED', 'products', NEW.id,
      jsonb_build_object(
        'name', NEW.name,
        'sku', NEW.sku,
        'quantity', NEW.quantity,
        'price', NEW.price,
        'category', NEW.category,
        'room_id', NEW.room_id
      ),
      'info'
    );

    -- Record INITIAL_STOCK in ledger if starting stock > 0
    IF NEW.quantity > 0 THEN
      INSERT INTO public.inventory_movements (
        shop_id, product_id, variant_id, movement_type, quantity,
        quantity_before, quantity_after, to_location_id,
        reference_id, reference_type, performed_by, created_at,
        reason, metadata, idempotency_key
      ) VALUES (
        NEW.shop_id, NEW.id, NULL, 'INITIAL_STOCK', NEW.quantity,
        0, NEW.quantity, NEW.room_id,
        NEW.id, 'initial_stock', auth.uid(), now(),
        'Initial stock at creation',
        jsonb_build_object('product_name', NEW.name, 'sku', NEW.sku),
        'init_stock:' || NEW.id::text
      ) ON CONFLICT (shop_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Check Archive / Restore lifecycle events first
    IF (NEW.is_archived AND NOT OLD.is_archived) THEN
      INSERT INTO public.audit_logs (
        shop_id, user_id, event_type, entity_type, entity_id, payload, severity
      ) VALUES (
        NEW.shop_id, auth.uid(), 'PRODUCT_ARCHIVED', 'products', NEW.id,
        jsonb_build_object(
          'name', NEW.name,
          'sku', NEW.sku,
          'reason', COALESCE(NEW.archive_reason, 'Archived')
        ),
        'warning'
      );
    ELSIF (OLD.is_archived AND NOT NEW.is_archived) THEN
      INSERT INTO public.audit_logs (
        shop_id, user_id, event_type, entity_type, entity_id, payload, severity
      ) VALUES (
        NEW.shop_id, auth.uid(), 'PRODUCT_RESTORED', 'products', NEW.id,
        jsonb_build_object('name', NEW.name, 'sku', NEW.sku),
        'info'
      );
    END IF;

    -- Build structured changes object for metadata diffs
    IF NEW.name IS DISTINCT FROM OLD.name THEN
      v_changes := jsonb_set(v_changes, '{name}', jsonb_build_object('before', OLD.name, 'after', NEW.name));
    END IF;
    IF NEW.sku IS DISTINCT FROM OLD.sku THEN
      v_changes := jsonb_set(v_changes, '{sku}', jsonb_build_object('before', OLD.sku, 'after', NEW.sku));
    END IF;
    IF NEW.category IS DISTINCT FROM OLD.category THEN
      v_changes := jsonb_set(v_changes, '{category}', jsonb_build_object('before', OLD.category, 'after', NEW.category));
    END IF;
    IF NEW.price IS DISTINCT FROM OLD.price THEN
      v_changes := jsonb_set(v_changes, '{price}', jsonb_build_object('before', OLD.price, 'after', NEW.price));
    END IF;
    IF NEW.room_id IS DISTINCT FROM OLD.room_id THEN
      v_changes := jsonb_set(v_changes, '{room_id}', jsonb_build_object('before', OLD.room_id, 'after', NEW.room_id));
    END IF;
    IF NEW.min_stock IS DISTINCT FROM OLD.min_stock THEN
      v_changes := jsonb_set(v_changes, '{min_stock}', jsonb_build_object('before', OLD.min_stock, 'after', NEW.min_stock));
    END IF;
    IF NEW.size IS DISTINCT FROM OLD.size THEN
      v_changes := jsonb_set(v_changes, '{size}', jsonb_build_object('before', OLD.size, 'after', NEW.size));
    END IF;

    IF v_changes <> '{}'::jsonb THEN
      INSERT INTO public.audit_logs (
        shop_id, user_id, event_type, entity_type, entity_id, payload, severity
      ) VALUES (
        NEW.shop_id, auth.uid(), 'PRODUCT_UPDATED', 'products', NEW.id,
        jsonb_build_object(
          'name', NEW.name,
          'changes', v_changes
        ),
        'info'
      );
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      shop_id, user_id, event_type, entity_type, entity_id, payload, severity
    ) VALUES (
      OLD.shop_id, auth.uid(), 'PRODUCT_DELETED', 'products', OLD.id,
      jsonb_build_object('name', OLD.name, 'sku', OLD.sku, 'category', OLD.category),
      'warning'
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 7. manage_product RPC with Archiving Support ────────────────────────────
CREATE OR REPLACE FUNCTION public.manage_product(
  p_op text, -- 'INSERT' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'RESTORE'
  p_product jsonb
)
RETURNS uuid AS $$
DECLARE
  v_product_id uuid;
  v_shop_id    uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  v_product_id := (p_product->>'id')::uuid;
  v_shop_id    := (p_product->>'shop_id')::uuid;

  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = v_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF p_op = 'INSERT' THEN
    INSERT INTO public.products (
      id, shop_id, room_id, name, sku, category, quantity, min_stock, price, size
    )
    VALUES (
      v_product_id, v_shop_id, (p_product->>'room_id')::uuid,
      p_product->>'name', p_product->>'sku', p_product->>'category',
      COALESCE((p_product->>'quantity')::integer, 0),
      COALESCE((p_product->>'min_stock')::integer, 5),
      COALESCE((p_product->>'price')::numeric, 0),
      p_product->>'size'
    )
    ON CONFLICT (id) DO NOTHING;

  ELSIF p_op = 'UPDATE' THEN
    UPDATE public.products
    SET
      room_id = COALESCE((p_product->>'room_id')::uuid, room_id),
      name = COALESCE(p_product->>'name', name),
      sku = COALESCE(p_product->>'sku', sku),
      category = COALESCE(p_product->>'category', category),
      min_stock = COALESCE((p_product->>'min_stock')::integer, min_stock),
      price = COALESCE((p_product->>'price')::numeric, price),
      size = COALESCE(p_product->>'size', size),
      updated_at = now()
    WHERE id = v_product_id AND shop_id = v_shop_id;

  ELSIF p_op = 'ARCHIVE' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = v_shop_id AND user_id = auth.uid() AND role IN ('owner', 'manager')
    ) THEN
      RAISE EXCEPTION 'Only owners and managers can archive products' USING ERRCODE = '42501';
    END IF;

    UPDATE public.products
    SET
      is_archived = true,
      archived_at = now(),
      archive_reason = COALESCE(p_product->>'reason', 'Archived by user'),
      updated_at = now()
    WHERE id = v_product_id AND shop_id = v_shop_id;

  ELSIF p_op = 'RESTORE' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = v_shop_id AND user_id = auth.uid() AND role IN ('owner', 'manager')
    ) THEN
      RAISE EXCEPTION 'Only owners and managers can restore products' USING ERRCODE = '42501';
    END IF;

    UPDATE public.products
    SET
      is_archived = false,
      archived_at = NULL,
      archive_reason = NULL,
      updated_at = now()
    WHERE id = v_product_id AND shop_id = v_shop_id;

  ELSIF p_op = 'DELETE' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = v_shop_id AND user_id = auth.uid() AND role = 'owner'
    ) THEN
      RAISE EXCEPTION 'Only owners can delete products' USING ERRCODE = '42501';
    END IF;

    -- Soft-archive by default when delete is requested to preserve movement history
    UPDATE public.products
    SET
      is_archived = true,
      archived_at = now(),
      archive_reason = COALESCE(p_product->>'reason', 'Deleted/Archived by owner'),
      updated_at = now()
    WHERE id = v_product_id AND shop_id = v_shop_id;
  END IF;

  RETURN v_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 8. Atomic record_sale with inventory_movements ──────────────────────────
CREATE OR REPLACE FUNCTION public.record_sale(
  p_sale  jsonb,
  p_items jsonb
)
RETURNS uuid AS $$
DECLARE
  v_sale_id         uuid;
  v_shop_id         uuid;
  v_item            jsonb;
  v_product_id      uuid;
  v_variant_id      uuid;
  v_qty             integer;
  v_unit_price      numeric;
  v_current_qty     integer;
  v_customer_id     uuid;
  v_total_amount    numeric;
  v_amount_paid     numeric;
  v_debt            numeric;
  v_idempotency_key text;
  v_original_price  numeric;
  v_override_reason text;
  v_invoice_number  text;
  v_prod_room_id    uuid;
  v_sale_time       timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  v_sale_id := (p_sale->>'id')::uuid;
  v_shop_id := (p_sale->>'shop_id')::uuid;
  v_idempotency_key := p_sale->>'idempotency_key';
  v_invoice_number := p_sale->>'invoice_number';
  v_sale_time := COALESCE((p_sale->>'created_at')::timestamptz, now());

  -- Idempotency check 1: UUID
  IF EXISTS (SELECT 1 FROM public.sales WHERE id = v_sale_id) THEN
    RETURN v_sale_id;
  END IF;

  -- Idempotency check 2: idempotency_key
  IF v_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.sales WHERE idempotency_key = v_idempotency_key) THEN
      RETURN v_sale_id;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = v_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for this shop' USING ERRCODE = '42501';
  END IF;

  v_total_amount := (p_sale->>'total_amount')::numeric;
  v_amount_paid  := COALESCE((p_sale->>'amount_paid')::numeric, v_total_amount);
  v_customer_id  := NULLIF(p_sale->>'customer_id', '')::uuid;

  IF v_customer_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = v_customer_id AND shop_id = v_shop_id
    ) THEN
      RAISE EXCEPTION 'Customer does not belong to this shop' USING ERRCODE = '42501';
    END IF;
  END IF;

  INSERT INTO public.sales (
    id, shop_id, user_id, total_amount, payment_method,
    delivery_address, customer_id, amount_paid, synced, created_at, idempotency_key, status, invoice_number
  )
  VALUES (
    v_sale_id, v_shop_id, auth.uid(), v_total_amount,
    COALESCE(p_sale->>'payment_method', 'cash'),
    p_sale->>'delivery_address',
    v_customer_id, v_amount_paid, true,
    v_sale_time,
    v_idempotency_key,
    COALESCE(p_sale->>'status', 'completed'),
    v_invoice_number
  );

  v_debt := v_total_amount - v_amount_paid;
  IF v_customer_id IS NOT NULL AND v_debt > 0 THEN
    UPDATE public.customers
    SET balance = balance - v_debt, updated_at = now()
    WHERE id = v_customer_id;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_variant_id := NULLIF(v_item->>'variant_id', '')::uuid;
    v_qty        := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;
    v_original_price := (v_item->>'original_price')::numeric;
    v_override_reason := v_item->>'override_reason';

    SELECT room_id INTO v_prod_room_id FROM public.products WHERE id = v_product_id;

    IF v_variant_id IS NOT NULL THEN
      -- Deduct variant stock
      SELECT quantity INTO v_current_qty
      FROM public.product_variants
      WHERE id = v_variant_id AND product_id = v_product_id
      FOR UPDATE;

      IF v_current_qty IS NULL THEN
        RAISE EXCEPTION 'Variant % not found for product %', v_variant_id, v_product_id;
      END IF;

      INSERT INTO public.sale_items (id, sale_id, product_id, variant_id, quantity, unit_price, original_price, override_reason)
      VALUES (
        COALESCE((v_item->>'id')::uuid, gen_random_uuid()),
        v_sale_id, v_product_id, v_variant_id, v_qty, v_unit_price, v_original_price, v_override_reason
      );

      UPDATE public.product_variants
      SET quantity = quantity - v_qty
      WHERE id = v_variant_id;

      -- Legacy stock_movements
      INSERT INTO public.stock_movements (
        shop_id, product_id, variant_id, type, delta, snapshot_qty,
        device_id, reason, user_id, synced, created_at
      )
      VALUES (
        v_shop_id, v_product_id, v_variant_id, 'OUT', v_qty,
        v_current_qty - v_qty,
        COALESCE(p_sale->>'device_id', 'server'),
        'sale', auth.uid(), true, v_sale_time
      );

      -- Immutable inventory_movements ledger
      INSERT INTO public.inventory_movements (
        shop_id, product_id, variant_id, movement_type, quantity,
        quantity_before, quantity_after, from_location_id, to_location_id,
        reference_id, reference_type, performed_by, created_at, reason,
        metadata, idempotency_key
      )
      VALUES (
        v_shop_id, v_product_id, v_variant_id, 'SALE', -v_qty,
        v_current_qty, v_current_qty - v_qty,
        v_prod_room_id, NULL,
        v_sale_id, 'sale', auth.uid(), v_sale_time,
        'Sale #' || COALESCE(v_invoice_number, substring(v_sale_id::text from 1 for 8)),
        jsonb_build_object(
          'sale_id', v_sale_id,
          'invoice_number', v_invoice_number,
          'unit_price', v_unit_price,
          'original_price', v_original_price,
          'override_reason', v_override_reason,
          'payment_method', COALESCE(p_sale->>'payment_method', 'cash'),
          'customer_id', v_customer_id
        ),
        CASE
          WHEN v_idempotency_key IS NOT NULL THEN v_idempotency_key || ':' || v_variant_id::text
          ELSE v_sale_id::text || ':' || v_variant_id::text
        END
      )
      ON CONFLICT (shop_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    ELSE
      -- Deduct base product stock
      SELECT quantity INTO v_current_qty
      FROM public.products
      WHERE id = v_product_id AND shop_id = v_shop_id
      FOR UPDATE;

      IF v_current_qty IS NULL THEN
        RAISE EXCEPTION 'Product % not found in this shop', v_product_id;
      END IF;

      INSERT INTO public.sale_items (id, sale_id, product_id, quantity, unit_price, original_price, override_reason)
      VALUES (
        COALESCE((v_item->>'id')::uuid, gen_random_uuid()),
        v_sale_id, v_product_id, v_qty, v_unit_price, v_original_price, v_override_reason
      );

      UPDATE public.products
      SET quantity = quantity - v_qty, updated_at = now()
      WHERE id = v_product_id;

      -- Legacy stock_movements
      INSERT INTO public.stock_movements (
        shop_id, product_id, type, delta, snapshot_qty,
        device_id, reason, user_id, synced, created_at
      )
      VALUES (
        v_shop_id, v_product_id, 'OUT', v_qty, v_current_qty - v_qty,
        COALESCE(p_sale->>'device_id', 'server'),
        'sale', auth.uid(), true, v_sale_time
      );

      -- Immutable inventory_movements ledger
      INSERT INTO public.inventory_movements (
        shop_id, product_id, variant_id, movement_type, quantity,
        quantity_before, quantity_after, from_location_id, to_location_id,
        reference_id, reference_type, performed_by, created_at, reason,
        metadata, idempotency_key
      )
      VALUES (
        v_shop_id, v_product_id, NULL, 'SALE', -v_qty,
        v_current_qty, v_current_qty - v_qty,
        v_prod_room_id, NULL,
        v_sale_id, 'sale', auth.uid(), v_sale_time,
        'Sale #' || COALESCE(v_invoice_number, substring(v_sale_id::text from 1 for 8)),
        jsonb_build_object(
          'sale_id', v_sale_id,
          'invoice_number', v_invoice_number,
          'unit_price', v_unit_price,
          'original_price', v_original_price,
          'override_reason', v_override_reason,
          'payment_method', COALESCE(p_sale->>'payment_method', 'cash'),
          'customer_id', v_customer_id
        ),
        CASE
          WHEN v_idempotency_key IS NOT NULL THEN v_idempotency_key || ':' || v_product_id::text
          ELSE v_sale_id::text || ':' || v_product_id::text
        END
      )
      ON CONFLICT (shop_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;
    END IF;

  END LOOP;

  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 9. Atomic void_sale with inventory_movements ─────────────────────────────
CREATE OR REPLACE FUNCTION public.void_sale(
  p_sale_id  uuid,
  p_shop_id  uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status          text;
  v_item            record;
  v_customer_id     uuid;
  v_total_amount    numeric;
  v_amount_paid     numeric;
  v_debt            numeric;
  v_prev_qty        integer;
  v_prod_room_id    uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id
      AND user_id = auth.uid()
      AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only shop owners can void sales' USING ERRCODE = '42501';
  END IF;

  SELECT status, customer_id, total_amount, amount_paid 
  INTO v_status, v_customer_id, v_total_amount, v_amount_paid
  FROM public.sales
  WHERE id = p_sale_id AND shop_id = p_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_status = 'voided' THEN
    RAISE EXCEPTION 'Sale is already voided' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.sales
  SET status = 'voided'
  WHERE id = p_sale_id AND shop_id = p_shop_id;

  IF v_customer_id IS NOT NULL THEN
    v_debt := COALESCE(v_total_amount, 0) - COALESCE(v_amount_paid, 0);
    IF v_debt > 0 THEN
      UPDATE public.customers
      SET balance = balance + v_debt,
          updated_at = now()
      WHERE id = v_customer_id AND shop_id = p_shop_id;
    END IF;
  END IF;

  FOR v_item IN (SELECT * FROM public.sale_items WHERE sale_id = p_sale_id)
  LOOP
    SELECT room_id INTO v_prod_room_id FROM public.products WHERE id = v_item.product_id;

    IF v_item.variant_id IS NOT NULL THEN
      SELECT quantity INTO v_prev_qty FROM public.product_variants WHERE id = v_item.variant_id FOR UPDATE;

      UPDATE public.product_variants
      SET quantity = quantity + v_item.quantity
      WHERE id = v_item.variant_id;

      INSERT INTO public.stock_movements (
        shop_id, product_id, variant_id, type, delta, snapshot_qty,
        device_id, reason, user_id, synced
      )
      VALUES (
        p_shop_id, v_item.product_id, v_item.variant_id, 'IN', v_item.quantity,
        v_prev_qty + v_item.quantity,
        'server-void', 'adjustment', auth.uid(), true
      );

      INSERT INTO public.inventory_movements (
        shop_id, product_id, variant_id, movement_type, quantity,
        quantity_before, quantity_after, from_location_id, to_location_id,
        reference_id, reference_type, performed_by, created_at, reason,
        metadata, idempotency_key
      )
      VALUES (
        p_shop_id, v_item.product_id, v_item.variant_id, 'SALE_VOID', v_item.quantity,
        v_prev_qty, v_prev_qty + v_item.quantity,
        NULL, v_prod_room_id,
        p_sale_id, 'sale', auth.uid(), now(),
        'Sale voided (restored stock)',
        jsonb_build_object('sale_id', p_sale_id, 'unit_price', v_item.unit_price),
        'void:' || p_sale_id::text || ':' || v_item.variant_id::text
      )
      ON CONFLICT (shop_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    ELSE
      SELECT quantity INTO v_prev_qty FROM public.products WHERE id = v_item.product_id AND shop_id = p_shop_id FOR UPDATE;

      UPDATE public.products
      SET quantity = quantity + v_item.quantity, updated_at = now()
      WHERE id = v_item.product_id AND shop_id = p_shop_id;

      INSERT INTO public.stock_movements (
        shop_id, product_id, type, delta, snapshot_qty,
        device_id, reason, user_id, synced
      )
      VALUES (
        p_shop_id, v_item.product_id, 'IN', v_item.quantity,
        v_prev_qty + v_item.quantity,
        'server-void', 'adjustment', auth.uid(), true
      );

      INSERT INTO public.inventory_movements (
        shop_id, product_id, variant_id, movement_type, quantity,
        quantity_before, quantity_after, from_location_id, to_location_id,
        reference_id, reference_type, performed_by, created_at, reason,
        metadata, idempotency_key
      )
      VALUES (
        p_shop_id, v_item.product_id, NULL, 'SALE_VOID', v_item.quantity,
        v_prev_qty, v_prev_qty + v_item.quantity,
        NULL, v_prod_room_id,
        p_sale_id, 'sale', auth.uid(), now(),
        'Sale voided (restored stock)',
        jsonb_build_object('sale_id', p_sale_id, 'unit_price', v_item.unit_price),
        'void:' || p_sale_id::text || ':' || v_item.product_id::text
      )
      ON CONFLICT (shop_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- ─── 10. Atomic transfer_stock with Paired Ledger Records ────────────────────
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
  v_dest_level_qty integer;
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

  -- Lock source product row
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

  -- Verify location stock
  SELECT quantity INTO v_level_qty FROM public.inventory_levels
   WHERE room_id = v_src_room AND product_id = p_source_product_id
     AND variant_id IS NOT DISTINCT FROM p_variant_id
   FOR UPDATE;
  IF v_level_qty IS NULL OR v_level_qty < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock in "%" (available: %)', v_src_room_name, COALESCE(v_level_qty, 0);
  END IF;

  -- Destination location current level
  SELECT COALESCE(quantity, 0) INTO v_dest_level_qty FROM public.inventory_levels
   WHERE room_id = p_dest_room_id AND product_id = p_source_product_id
     AND variant_id IS NOT DISTINCT FROM p_variant_id;
  v_dest_level_qty := COALESCE(v_dest_level_qty, 0);

  INSERT INTO public.stock_transfers (
    id, from_shop_id, to_shop_id, from_room_id, to_room_id, user_id, reason, transfer_date,
    from_shop_name, to_shop_name, from_room_name, to_room_name
  ) VALUES (
    p_transfer_id, v_src_shop, p_dest_shop_id, v_src_room, p_dest_room_id, v_user, v_reason, v_date,
    v_src_shop_name, v_dst_shop_name, v_src_room_name, v_dst_room_name
  );

  IF v_src_shop = p_dest_shop_id THEN
    -- ── Same-shop location transfer ──────────────────────────────────────────
    PERFORM public.adjust_inventory_level(v_src_shop, v_src_room,     p_source_product_id, p_variant_id, -p_quantity);
    PERFORM public.adjust_inventory_level(v_src_shop, p_dest_room_id, p_source_product_id, p_variant_id,  p_quantity);

    INSERT INTO public.stock_transfer_items (
      transfer_id, product_id, variant_id, dest_product_id, dest_variant_id,
      quantity, product_name, variant_size, sku
    ) VALUES (
      p_transfer_id, p_source_product_id, p_variant_id, p_source_product_id, p_variant_id,
      p_quantity, v_name, v_var_size, COALESCE(v_var_sku, v_sku)
    );

    -- Paired record 1: TRANSFER_OUT
    INSERT INTO public.inventory_movements (
      shop_id, product_id, variant_id, movement_type, quantity,
      quantity_before, quantity_after, from_location_id, to_location_id,
      reference_id, reference_type, performed_by, created_at, reason,
      metadata, idempotency_key
    ) VALUES (
      v_src_shop, p_source_product_id, p_variant_id, 'TRANSFER_OUT', -p_quantity,
      v_level_qty, v_level_qty - p_quantity,
      v_src_room, p_dest_room_id,
      p_transfer_id, 'transfer', v_user, v_date, v_reason,
      jsonb_build_object(
        'transfer_id', p_transfer_id,
        'from_room_name', v_src_room_name,
        'to_room_name', v_dst_room_name,
        'same_shop', true
      ),
      'transfer_out:' || p_transfer_id::text
    ) ON CONFLICT (shop_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    -- Paired record 2: TRANSFER_IN
    INSERT INTO public.inventory_movements (
      shop_id, product_id, variant_id, movement_type, quantity,
      quantity_before, quantity_after, from_location_id, to_location_id,
      reference_id, reference_type, performed_by, created_at, reason,
      metadata, idempotency_key
    ) VALUES (
      v_src_shop, p_source_product_id, p_variant_id, 'TRANSFER_IN', p_quantity,
      v_dest_level_qty, v_dest_level_qty + p_quantity,
      v_src_room, p_dest_room_id,
      p_transfer_id, 'transfer', v_user, v_date, v_reason,
      jsonb_build_object(
        'transfer_id', p_transfer_id,
        'from_room_name', v_src_room_name,
        'to_room_name', v_dst_room_name,
        'same_shop', true
      ),
      'transfer_in:' || p_transfer_id::text
    ) ON CONFLICT (shop_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    RETURN p_source_product_id;
  END IF;

  -- ── Inter-shop transfer ────────────────────────────────────────────────────
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

  -- Legacy stock movements
  INSERT INTO public.stock_movements (shop_id, product_id, variant_id, type, delta, snapshot_qty, device_id, reason, user_id, synced, created_at)
  VALUES (v_src_shop, p_source_product_id, p_variant_id, 'OUT', p_quantity, v_src_after,
          'transfer_to:' || p_dest_shop_id || ':' || p_dest_room_id, 'transfer', v_user, true, v_date);
  INSERT INTO public.stock_movements (shop_id, product_id, variant_id, type, delta, snapshot_qty, device_id, reason, user_id, synced, created_at)
  VALUES (p_dest_shop_id, v_dest_product, v_dest_variant, 'IN', p_quantity, COALESCE(v_dest_qty, 0) + p_quantity,
          'transfer_from:' || v_src_shop || ':' || v_src_room, 'transfer', v_user, true, v_date);

  -- Paired ledger record 1: TRANSFER_OUT in Source Shop
  INSERT INTO public.inventory_movements (
    shop_id, product_id, variant_id, movement_type, quantity,
    quantity_before, quantity_after, from_location_id, to_location_id,
    reference_id, reference_type, performed_by, created_at, reason,
    metadata, idempotency_key
  ) VALUES (
    v_src_shop, p_source_product_id, p_variant_id, 'TRANSFER_OUT', -p_quantity,
    v_level_qty, v_level_qty - p_quantity,
    v_src_room, p_dest_room_id,
    p_transfer_id, 'transfer', v_user, v_date, v_reason,
    jsonb_build_object(
      'transfer_id', p_transfer_id,
      'from_shop_name', v_src_shop_name,
      'dest_shop_name', v_dst_shop_name,
      'from_room_name', v_src_room_name,
      'to_room_name', v_dst_room_name
    ),
    'transfer_out:' || p_transfer_id::text
  ) ON CONFLICT (shop_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

  -- Paired ledger record 2: TRANSFER_IN in Destination Shop
  INSERT INTO public.inventory_movements (
    shop_id, product_id, variant_id, movement_type, quantity,
    quantity_before, quantity_after, from_location_id, to_location_id,
    reference_id, reference_type, performed_by, created_at, reason,
    metadata, idempotency_key
  ) VALUES (
    p_dest_shop_id, v_dest_product, v_dest_variant, 'TRANSFER_IN', p_quantity,
    COALESCE(v_dest_qty, 0), COALESCE(v_dest_qty, 0) + p_quantity,
    v_src_room, p_dest_room_id,
    p_transfer_id, 'transfer', v_user, v_date, v_reason,
    jsonb_build_object(
      'transfer_id', p_transfer_id,
      'from_shop_name', v_src_shop_name,
      'dest_shop_name', v_dst_shop_name,
      'from_room_name', v_src_room_name,
      'to_room_name', v_dst_room_name
    ),
    'transfer_in:' || p_transfer_id::text
  ) ON CONFLICT (shop_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

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

-- ─── 11. Transactional record_inventory_movement RPC ─────────────────────────
-- Unified RPC for RESTOCK, RECEIVE, ADJUSTMENT_IN, ADJUSTMENT_OUT, DAMAGE, LOSS, FOUND, RETURN
CREATE OR REPLACE FUNCTION public.record_inventory_movement(
  p_movement jsonb
)
RETURNS uuid AS $$
DECLARE
  v_movement_id     uuid;
  v_shop_id         uuid;
  v_product_id      uuid;
  v_variant_id      uuid;
  v_location_id     uuid;
  v_movement_type   text;
  v_quantity        integer;
  v_abs_qty         integer;
  v_current_qty     integer;
  v_new_qty         integer;
  v_reason          text;
  v_ref_id          uuid;
  v_ref_type        text;
  v_idempotency_key text;
  v_metadata        jsonb;
  v_user            uuid := auth.uid();
  v_created_at      timestamptz;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  v_movement_id     := COALESCE(NULLIF(p_movement->>'id', '')::uuid, gen_random_uuid());
  v_shop_id         := (p_movement->>'shop_id')::uuid;
  v_product_id      := (p_movement->>'product_id')::uuid;
  v_variant_id      := NULLIF(p_movement->>'variant_id', '')::uuid;
  v_location_id     := NULLIF(p_movement->>'location_id', '')::uuid;
  v_movement_type   := UPPER(p_movement->>'movement_type');
  v_abs_qty         := ABS((p_movement->>'quantity')::integer);
  v_reason          := p_movement->>'reason';
  v_ref_id          := NULLIF(p_movement->>'reference_id', '')::uuid;
  v_ref_type        := p_movement->>'reference_type';
  v_idempotency_key := NULLIF(p_movement->>'idempotency_key', '');
  v_metadata        := COALESCE((p_movement->'metadata'), '{}'::jsonb);
  v_created_at      := COALESCE((p_movement->>'created_at')::timestamptz, now());

  IF v_abs_qty <= 0 THEN
    RAISE EXCEPTION 'Movement quantity must be greater than zero';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = v_shop_id AND user_id = v_user
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  -- Idempotency check
  IF EXISTS (SELECT 1 FROM public.inventory_movements WHERE id = v_movement_id) THEN
    RETURN v_movement_id;
  END IF;
  IF v_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_movement_id FROM public.inventory_movements
     WHERE shop_id = v_shop_id AND idempotency_key = v_idempotency_key;
    IF FOUND THEN
      RETURN v_movement_id;
    END IF;
    v_movement_id := COALESCE(NULLIF(p_movement->>'id', '')::uuid, gen_random_uuid());
  END IF;

  -- Determine signed quantity
  IF v_movement_type IN ('RECEIVE', 'RESTOCK', 'ADJUSTMENT_IN', 'RETURN', 'FOUND', 'INITIAL_STOCK') THEN
    v_quantity := v_abs_qty;
  ELSIF v_movement_type IN ('SALE', 'SALE_VOID', 'TRANSFER_OUT', 'ADJUSTMENT_OUT', 'DAMAGE', 'LOSS') THEN
    v_quantity := -v_abs_qty;
  ELSE
    RAISE EXCEPTION 'Invalid movement_type: %', v_movement_type;
  END IF;

  -- If a specific location is targeted for deduction, check location stock first
  IF v_location_id IS NOT NULL AND v_quantity < 0 THEN
    DECLARE
      v_loc_qty integer;
    BEGIN
      SELECT quantity INTO v_loc_qty
      FROM public.inventory_levels
      WHERE room_id = v_location_id
        AND product_id = v_product_id
        AND variant_id IS NOT DISTINCT FROM v_variant_id;
      IF v_loc_qty IS NULL OR v_loc_qty < v_abs_qty THEN
        RAISE EXCEPTION 'Insufficient stock in chosen location (available: %, requested: %)', COALESCE(v_loc_qty, 0), v_abs_qty;
      END IF;
    END;
  END IF;

  -- When a specific location is provided, adjust levels explicitly to prevent double adjustment by trg_products_to_levels
  IF v_location_id IS NOT NULL THEN
    PERFORM set_config('app.skip_level_sync', 'on', true);
  END IF;

  -- Product check and lock
  IF v_variant_id IS NOT NULL THEN
    SELECT quantity INTO v_current_qty
    FROM public.product_variants
    WHERE id = v_variant_id AND product_id = v_product_id
    FOR UPDATE;

    IF v_current_qty IS NULL THEN
      IF v_location_id IS NOT NULL THEN PERFORM set_config('app.skip_level_sync', 'off', true); END IF;
      RAISE EXCEPTION 'Variant not found';
    END IF;

    IF v_quantity < 0 AND v_current_qty < v_abs_qty THEN
      IF v_location_id IS NOT NULL THEN PERFORM set_config('app.skip_level_sync', 'off', true); END IF;
      RAISE EXCEPTION 'Insufficient stock (available: %, requested: %)', v_current_qty, v_abs_qty;
    END IF;

    v_new_qty := v_current_qty + v_quantity;
    UPDATE public.product_variants SET quantity = v_new_qty WHERE id = v_variant_id;
  ELSE
    SELECT quantity, COALESCE(v_location_id, room_id) INTO v_current_qty, v_location_id
    FROM public.products
    WHERE id = v_product_id AND shop_id = v_shop_id
    FOR UPDATE;

    IF v_current_qty IS NULL THEN
      IF v_location_id IS NOT NULL THEN PERFORM set_config('app.skip_level_sync', 'off', true); END IF;
      RAISE EXCEPTION 'Product not found';
    END IF;

    IF v_quantity < 0 AND v_current_qty < v_abs_qty THEN
      IF v_location_id IS NOT NULL THEN PERFORM set_config('app.skip_level_sync', 'off', true); END IF;
      RAISE EXCEPTION 'Insufficient stock (available: %, requested: %)', v_current_qty, v_abs_qty;
    END IF;

    v_new_qty := v_current_qty + v_quantity;
    UPDATE public.products SET quantity = v_new_qty, updated_at = now() WHERE id = v_product_id;
  END IF;

  -- Adjust location inventory_levels directly if specific room provided
  IF v_location_id IS NOT NULL THEN
    PERFORM public.adjust_inventory_level(v_shop_id, v_location_id, v_product_id, v_variant_id, v_quantity);
    PERFORM set_config('app.skip_level_sync', 'off', true);
  END IF;

  -- Insert immutable ledger record
  INSERT INTO public.inventory_movements (
    id, shop_id, product_id, variant_id, movement_type, quantity,
    quantity_before, quantity_after,
    from_location_id, to_location_id,
    reference_id, reference_type, performed_by, created_at,
    reason, metadata, idempotency_key
  ) VALUES (
    v_movement_id, v_shop_id, v_product_id, v_variant_id, v_movement_type, v_quantity,
    v_current_qty, v_new_qty,
    CASE WHEN v_quantity < 0 THEN v_location_id ELSE NULL END,
    CASE WHEN v_quantity > 0 THEN v_location_id ELSE NULL END,
    v_ref_id, v_ref_type, v_user, v_created_at,
    v_reason, v_metadata, v_idempotency_key
  );

  -- Backwards-compatible legacy stock_movements entry
  INSERT INTO public.stock_movements (
    id, shop_id, product_id, variant_id, type, delta, snapshot_qty,
    device_id, reason, user_id, synced, created_at
  ) VALUES (
    v_movement_id, v_shop_id, v_product_id, v_variant_id,
    CASE WHEN v_quantity > 0 THEN 'IN' ELSE 'OUT' END,
    v_abs_qty, v_new_qty,
    COALESCE(p_movement->>'device_id', 'server'),
    CASE
      WHEN v_movement_type IN ('RESTOCK', 'RECEIVE') THEN 'restock'::movement_reason
      ELSE 'adjustment'::movement_reason
    END,
    v_user, true, v_created_at
  ) ON CONFLICT (id) DO NOTHING;

  RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 12. Upgrade record_stock_movement for legacy callers ─────────────────────
CREATE OR REPLACE FUNCTION public.record_stock_movement(
  p_movement jsonb
)
RETURNS uuid AS $$
DECLARE
  v_movement_id uuid;
  v_shop_id     uuid;
  v_product_id  uuid;
  v_variant_id  uuid;
  v_delta       integer;
  v_type        movement_type;
  v_reason_str  text;
  v_mtype       text;
BEGIN
  v_type       := (p_movement->>'type')::movement_type;
  v_reason_str := COALESCE(p_movement->>'reason', 'adjustment');

  IF v_type = 'IN' THEN
    IF v_reason_str = 'restock' THEN v_mtype := 'RESTOCK';
    ELSE v_mtype := 'ADJUSTMENT_IN'; END IF;
  ELSE
    IF v_reason_str = 'damage' THEN v_mtype := 'DAMAGE';
    ELSIF v_reason_str = 'loss' THEN v_mtype := 'LOSS';
    ELSE v_mtype := 'ADJUSTMENT_OUT'; END IF;
  END IF;

  RETURN public.record_inventory_movement(
    p_movement || jsonb_build_object('movement_type', v_mtype, 'quantity', (p_movement->>'delta')::integer)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.record_inventory_movement(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_stock_movement(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_stock(uuid, uuid, uuid, uuid, uuid, uuid, integer, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_sale(jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.void_sale(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manage_product(text, jsonb) TO authenticated;
