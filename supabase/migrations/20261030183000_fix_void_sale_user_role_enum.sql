-- ==============================================================================
-- 20261030183000_fix_void_sale_user_role_enum.sql
--
-- Fix: "invalid input value for enum user_role: 'manager'"
--
-- The user_role enum type is defined as ('owner', 'staff').
-- References to ('owner', 'manager') in void_sale and manage_product caused
-- PostgreSQL to fail with an invalid enum cast error whenever void_sale was called.
-- This migration updates void_sale and manage_product to check role = 'owner',
-- matching the AutoShop Pro authorization architecture.
-- ==============================================================================

BEGIN;

-- ─── 1. Fix void_sale RPC ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.void_sale(
  p_sale_id uuid,
  p_shop_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- ─── 2. Fix manage_product RPC ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.manage_product(
  p_op text, -- 'INSERT' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'RESTORE'
  p_product jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    IF NOT v_caller_is_admin AND NOT v_caller_is_owner THEN
      RAISE EXCEPTION 'Only owners can archive products' USING ERRCODE = '42501';
    END IF;

    UPDATE public.products
    SET
      is_archived = true,
      archived_at = now(),
      archive_reason = COALESCE(p_product->>'reason', 'Archived by user'),
      updated_at = now()
    WHERE id = v_product_id AND shop_id = v_shop_id;

  ELSIF p_op = 'RESTORE' THEN
    IF NOT v_caller_is_admin AND NOT v_caller_is_owner THEN
      RAISE EXCEPTION 'Only owners can restore products' USING ERRCODE = '42501';
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
$$;

GRANT EXECUTE ON FUNCTION public.void_sale(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manage_product(text, jsonb) TO authenticated;

COMMIT;
