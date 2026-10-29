-- ==============================================================================
-- 20261028181500_hard_delete_products_and_low_stock_fix.sql
--
-- 1. Ensures owner product deletion (manage_product DELETE and bulk_delete_products)
--    actually deletes the product row from public.products in the database:
--    - Makes sale_items.product_id and po_items.product_id nullable with
--      ON DELETE SET NULL so historical sales/POs never block hard deletion.
--    - Updates prevent_inventory_movement_mutation() to allow controlled cleanup
--      and FK ON DELETE SET NULL when a product/variant is deleted by the owner.
--    - Updates void_sale() to safely skip stock restoration for deleted products.
--    - Cleans up stale Low Stock / Stock Out notifications for deleted products.
--    - Purges any previously owner-deleted products that were soft-archived.
-- 2. Updates get_low_stock_products() and trigger_check_stock_levels() to
--    strictly exclude archived products (COALESCE(is_archived, false) = false)
--    so deleted or archived products never appear as low stock.
-- ==============================================================================

BEGIN;

-- ─── 1. Remove duplicate product audit trigger if present ─────────────────────
DROP TRIGGER IF EXISTS on_product_modified ON public.products;

-- ─── 2. Decouple sale_items and po_items FKs for clean hard deletion ──────────
ALTER TABLE public.sale_items
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE public.sale_items
  DROP CONSTRAINT IF EXISTS sale_items_product_id_fkey;

ALTER TABLE public.sale_items
  ADD CONSTRAINT sale_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.po_items
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE public.po_items
  DROP CONSTRAINT IF EXISTS po_items_product_id_fkey;

ALTER TABLE public.po_items
  ADD CONSTRAINT po_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

-- ─── 3. Allow FK unlink & owner product deletion on inventory_movements ───────
CREATE OR REPLACE FUNCTION public.prevent_inventory_movement_mutation()
RETURNS trigger AS $$
BEGIN
  -- Allow explicit controlled cleanup during owner product deletion
  IF current_setting('app.allow_movement_mutation', true) = 'on' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Allow PostgreSQL's ON DELETE SET NULL foreign key action when a product
  -- or variant is deleted, provided no ledger quantities or metadata change
  IF TG_OP = 'UPDATE'
     AND NEW.id IS NOT DISTINCT FROM OLD.id
     AND NEW.shop_id IS NOT DISTINCT FROM OLD.shop_id
     AND NEW.movement_type IS NOT DISTINCT FROM OLD.movement_type
     AND NEW.quantity IS NOT DISTINCT FROM OLD.quantity
     AND NEW.quantity_before IS NOT DISTINCT FROM OLD.quantity_before
     AND NEW.quantity_after IS NOT DISTINCT FROM OLD.quantity_after
     AND (NEW.product_id IS NULL OR NEW.product_id IS NOT DISTINCT FROM OLD.product_id)
     AND (NEW.variant_id IS NULL OR NEW.variant_id IS NOT DISTINCT FROM OLD.variant_id)
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'inventory_movements is immutable and cannot be updated or deleted'
    USING ERRCODE = '42501';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 4. Update void_sale to handle deleted products gracefully ────────────────
CREATE OR REPLACE FUNCTION public.void_sale(
  p_sale_id uuid,
  p_shop_id uuid
)
RETURNS void AS $$
DECLARE
  v_status       text;
  v_item         record;
  v_customer_id  uuid;
  v_total_amount numeric;
  v_amount_paid  numeric;
  v_debt         numeric;
  v_prev_qty     integer;
  v_prod_room_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'manager')
  ) THEN
    RAISE EXCEPTION 'Only shop owners or managers can void sales' USING ERRCODE = '42501';
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
    -- If the product was hard-deleted by the owner, skip stock restoration
    IF v_item.product_id IS NULL THEN
      CONTINUE;
    END IF;

    SELECT room_id INTO v_prod_room_id
    FROM public.products
    WHERE id = v_item.product_id AND shop_id = p_shop_id;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    IF v_item.variant_id IS NOT NULL THEN
      SELECT quantity INTO v_prev_qty
      FROM public.product_variants
      WHERE id = v_item.variant_id
      FOR UPDATE;

      IF FOUND THEN
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
      END IF;
    ELSE
      SELECT quantity INTO v_prev_qty
      FROM public.products
      WHERE id = v_item.product_id AND shop_id = p_shop_id
      FOR UPDATE;

      IF FOUND THEN
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
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 5. Hard-Delete manage_product RPC ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.manage_product(
  p_op text, -- 'INSERT' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'RESTORE'
  p_product jsonb
)
RETURNS uuid AS $$
DECLARE
  v_product_id      uuid;
  v_shop_id         uuid;
  v_caller_is_admin boolean := false;
  v_caller_is_owner boolean := false;
  v_prod_name       text;
  v_prod_sku        text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  v_product_id := (p_product->>'id')::uuid;
  v_shop_id    := (p_product->>'shop_id')::uuid;

  IF v_product_id IS NULL OR v_shop_id IS NULL THEN
    RAISE EXCEPTION 'Missing product id or shop_id' USING ERRCODE = '22000';
  END IF;

  -- Check if caller is super admin
  SELECT COALESCE(is_admin, false) INTO v_caller_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  -- Check if caller is owner in shop_members
  SELECT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = v_shop_id AND user_id = auth.uid() AND role = 'owner'
  ) INTO v_caller_is_owner;

  -- Ensure caller is member of this shop or admin
  IF NOT v_caller_is_admin AND NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = v_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF p_op = 'INSERT' THEN
    INSERT INTO public.products (
      id, shop_id, room_id, name, sku, category, quantity, min_stock, price, size, is_archived
    )
    VALUES (
      v_product_id, v_shop_id, (p_product->>'room_id')::uuid,
      p_product->>'name', p_product->>'sku', p_product->>'category',
      COALESCE((p_product->>'quantity')::integer, 0),
      COALESCE((p_product->>'min_stock')::integer, 5),
      COALESCE((p_product->>'price')::numeric, 0),
      p_product->>'size',
      false
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
    IF NOT v_caller_is_admin AND NOT v_caller_is_owner AND NOT EXISTS (
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
    IF NOT v_caller_is_admin AND NOT v_caller_is_owner AND NOT EXISTS (
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
    IF NOT v_caller_is_admin AND NOT v_caller_is_owner THEN
      RAISE EXCEPTION 'Only owners can delete products' USING ERRCODE = '42501';
    END IF;

    SELECT name, sku INTO v_prod_name, v_prod_sku
    FROM public.products
    WHERE id = v_product_id AND shop_id = v_shop_id;

    -- Clean up any Low Stock / Stock Out notifications for this product
    IF v_prod_name IS NOT NULL THEN
      DELETE FROM public.shop_notifications
      WHERE shop_id = v_shop_id
        AND title IN ('Low Stock Alert', 'Stock Out Alert')
        AND (
          message ILIKE '%"' || v_prod_name || '%'
          OR (v_prod_sku IS NOT NULL AND v_prod_sku <> '' AND message ILIKE '%(SKU: ' || v_prod_sku || ')%')
        );
    END IF;

    PERFORM set_config('app.allow_movement_mutation', 'on', true);

    DELETE FROM public.inventory_levels WHERE product_id = v_product_id AND shop_id = v_shop_id;
    DELETE FROM public.inventory_movements WHERE product_id = v_product_id AND shop_id = v_shop_id;
    DELETE FROM public.stock_movements WHERE product_id = v_product_id AND shop_id = v_shop_id;
    DELETE FROM public.products WHERE id = v_product_id AND shop_id = v_shop_id;

    PERFORM set_config('app.allow_movement_mutation', 'off', true);
  END IF;

  RETURN v_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 6. Hard-Delete bulk_delete_products RPC ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.bulk_delete_products(
  p_shop_id     uuid,
  p_product_ids uuid[]
)
RETURNS uuid[] AS $$
DECLARE
  v_caller_is_admin boolean := false;
  v_caller_is_owner boolean := false;
  v_pid             uuid;
  v_prod_name       text;
  v_prod_sku        text;
  v_deleted_ids     uuid[] := ARRAY[]::uuid[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(is_admin, false) INTO v_caller_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  SELECT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid() AND role = 'owner'
  ) INTO v_caller_is_owner;

  IF NOT v_caller_is_admin AND NOT v_caller_is_owner THEN
    RAISE EXCEPTION 'Only owners can bulk delete products' USING ERRCODE = '42501';
  END IF;

  PERFORM set_config('app.allow_movement_mutation', 'on', true);

  FOREACH v_pid IN ARRAY p_product_ids LOOP
    SELECT name, sku INTO v_prod_name, v_prod_sku
    FROM public.products
    WHERE id = v_pid AND shop_id = p_shop_id;

    IF v_prod_name IS NOT NULL THEN
      DELETE FROM public.shop_notifications
      WHERE shop_id = p_shop_id
        AND title IN ('Low Stock Alert', 'Stock Out Alert')
        AND (
          message ILIKE '%"' || v_prod_name || '%'
          OR (v_prod_sku IS NOT NULL AND v_prod_sku <> '' AND message ILIKE '%(SKU: ' || v_prod_sku || ')%')
        );
    END IF;

    DELETE FROM public.inventory_levels WHERE product_id = v_pid AND shop_id = p_shop_id;
    DELETE FROM public.inventory_movements WHERE product_id = v_pid AND shop_id = p_shop_id;
    DELETE FROM public.stock_movements WHERE product_id = v_pid AND shop_id = p_shop_id;
    DELETE FROM public.products WHERE id = v_pid AND shop_id = p_shop_id;
    v_deleted_ids := array_append(v_deleted_ids, v_pid);
  END LOOP;

  PERFORM set_config('app.allow_movement_mutation', 'off', true);

  RETURN v_deleted_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 7. Exclude archived products from get_low_stock_products ─────────────────
CREATE OR REPLACE FUNCTION public.get_low_stock_products(p_shop_id uuid)
RETURNS TABLE (
  id        uuid,
  name      text,
  sku       text,
  quantity  integer,
  min_stock integer,
  room_id   uuid,
  category  text
) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY

  -- Simple products: active (not archived), no variants, stock below minimum
  SELECT
    p.id, p.name, p.sku,
    p.quantity, p.min_stock,
    p.room_id, p.category
  FROM public.products p
  WHERE p.shop_id = p_shop_id
    AND COALESCE(p.is_archived, false) = false
    AND p.quantity <= p.min_stock
    AND NOT EXISTS (
      SELECT 1 FROM public.product_variants v WHERE v.product_id = p.id
    )

  UNION ALL

  -- Variant products: active parent product, one row per low-stock size
  SELECT
    p.id,
    (p.name || ' — ' || pv.size)::text AS name,
    COALESCE(pv.sku, p.sku)::text       AS sku,
    pv.quantity,
    pv.min_stock,
    p.room_id,
    p.category
  FROM public.products p
  JOIN public.product_variants pv ON pv.product_id = p.id
  WHERE p.shop_id = p_shop_id
    AND COALESCE(p.is_archived, false) = false
    AND pv.quantity <= pv.min_stock

  ORDER BY quantity ASC, name ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─── 8. Prevent archived products from firing stock alert notifications ───────
CREATE OR REPLACE FUNCTION public.trigger_check_stock_levels()
RETURNS trigger AS $$
DECLARE
  v_name        text;
  v_shop_id     uuid;
  v_is_archived boolean := false;
BEGIN
  IF NEW.quantity < OLD.quantity THEN
    IF TG_TABLE_NAME = 'product_variants' THEN
      SELECT name, shop_id, COALESCE(is_archived, false)
      INTO v_name, v_shop_id, v_is_archived
      FROM public.products
      WHERE id = NEW.product_id;

      IF v_is_archived THEN
        RETURN NEW;
      END IF;

      v_name := v_name || COALESCE(' - ' || NULLIF(NEW.size, ''), '');
      IF NEW.sku IS NOT NULL AND NEW.sku != '' THEN
        v_name := v_name || ' (SKU: ' || NEW.sku || ')';
      END IF;

      IF NEW.quantity <= 0 AND OLD.quantity > 0 THEN
        INSERT INTO public.shop_notifications (shop_id, title, message)
        VALUES (v_shop_id, 'Stock Out Alert', 'Variant "' || v_name || '" has run out of stock.');
      ELSIF NEW.quantity <= NEW.min_stock AND OLD.quantity > NEW.min_stock THEN
        INSERT INTO public.shop_notifications (shop_id, title, message)
        VALUES (v_shop_id, 'Low Stock Alert', 'Variant "' || v_name || '" is below minimum stock level (' || NEW.quantity || ' left).');
      END IF;

    ELSIF TG_TABLE_NAME = 'products' THEN
      IF COALESCE(NEW.is_archived, false) THEN
        RETURN NEW;
      END IF;

      v_name := NEW.name || COALESCE(' - ' || NULLIF(NEW.size, ''), '');
      IF NEW.sku IS NOT NULL AND NEW.sku != '' THEN
        v_name := v_name || ' (SKU: ' || NEW.sku || ')';
      END IF;

      IF NEW.quantity <= 0 AND OLD.quantity > 0 THEN
        INSERT INTO public.shop_notifications (shop_id, title, message)
        VALUES (NEW.shop_id, 'Stock Out Alert', 'Product "' || v_name || '" has run out of stock.');
      ELSIF NEW.quantity <= NEW.min_stock AND OLD.quantity > NEW.min_stock THEN
        INSERT INTO public.shop_notifications (shop_id, title, message)
        VALUES (NEW.shop_id, 'Low Stock Alert', 'Product "' || v_name || '" is below minimum stock level (' || NEW.quantity || ' left).');
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 9. Purge previously owner-deleted products that were soft-archived ───────
DO $$
DECLARE
  r record;
BEGIN
  PERFORM set_config('app.allow_movement_mutation', 'on', true);

  FOR r IN
    SELECT id, shop_id, name, sku
    FROM public.products
    WHERE is_archived = true
      AND (
        archive_reason ILIKE '%deleted%'
        OR archive_reason = 'Deleted/Archived by owner'
        OR archive_reason = 'Bulk deleted by owner'
      )
  LOOP
    DELETE FROM public.shop_notifications
    WHERE shop_id = r.shop_id
      AND title IN ('Low Stock Alert', 'Stock Out Alert')
      AND (
        message ILIKE '%"' || r.name || '%'
        OR (r.sku IS NOT NULL AND r.sku <> '' AND message ILIKE '%(SKU: ' || r.sku || ')%')
      );

    DELETE FROM public.inventory_levels WHERE product_id = r.id AND shop_id = r.shop_id;
    DELETE FROM public.inventory_movements WHERE product_id = r.id AND shop_id = r.shop_id;
    DELETE FROM public.stock_movements WHERE product_id = r.id AND shop_id = r.shop_id;
    DELETE FROM public.products WHERE id = r.id AND shop_id = r.shop_id;
  END LOOP;

  PERFORM set_config('app.allow_movement_mutation', 'off', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.manage_product(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_delete_products(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_low_stock_products(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.void_sale(uuid, uuid) TO authenticated;

COMMIT;
