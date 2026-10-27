-- ==============================================================================
-- 20261027160000_separate_location_products_and_movement_fix.sql
--
-- 1. Replaces the shop-wide (shop_id, sku) unique constraint on public.products
--    with a per-location unique index (shop_id, room_id, sku) on active products
--    so the same product/SKU can exist separately across different locations.
-- 2. Fixes record_inventory_movement so app.skip_level_sync is always enabled
--    before updating products/variants, preventing double level adjustments when
--    location_id falls back to products.room_id.
-- ==============================================================================

-- ─── 1. Per-Location Product Uniqueness ───────────────────────────────────────
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_shop_id_sku_key;

DROP INDEX IF EXISTS public.uq_products_shop_room_sku;
CREATE UNIQUE INDEX uq_products_shop_room_sku
  ON public.products (
    shop_id,
    COALESCE(room_id, '00000000-0000-0000-0000-000000000000'::uuid),
    sku
  )
  WHERE is_archived = false;

-- ─── 2. Fix record_inventory_movement level sync ──────────────────────────────
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

  -- Always suspend trigger-based level sync and adjust location explicitly once below
  PERFORM set_config('app.skip_level_sync', 'on', true);

  -- Product check and lock
  IF v_variant_id IS NOT NULL THEN
    SELECT v.quantity, COALESCE(v_location_id, p.room_id)
      INTO v_current_qty, v_location_id
      FROM public.product_variants v
      JOIN public.products p ON p.id = v.product_id
     WHERE v.id = v_variant_id AND v.product_id = v_product_id AND p.shop_id = v_shop_id
       FOR UPDATE OF v;

    IF v_current_qty IS NULL THEN
      PERFORM set_config('app.skip_level_sync', 'off', true);
      RAISE EXCEPTION 'Variant not found';
    END IF;

    IF v_quantity < 0 AND v_current_qty < v_abs_qty THEN
      PERFORM set_config('app.skip_level_sync', 'off', true);
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
      PERFORM set_config('app.skip_level_sync', 'off', true);
      RAISE EXCEPTION 'Product not found';
    END IF;

    IF v_quantity < 0 AND v_current_qty < v_abs_qty THEN
      PERFORM set_config('app.skip_level_sync', 'off', true);
      RAISE EXCEPTION 'Insufficient stock (available: %, requested: %)', v_current_qty, v_abs_qty;
    END IF;

    v_new_qty := v_current_qty + v_quantity;
    UPDATE public.products SET quantity = v_new_qty, updated_at = now() WHERE id = v_product_id;
  END IF;

  -- Adjust location inventory_levels directly
  IF v_location_id IS NOT NULL THEN
    PERFORM public.adjust_inventory_level(v_shop_id, v_location_id, v_product_id, v_variant_id, v_quantity);
  END IF;
  PERFORM set_config('app.skip_level_sync', 'off', true);

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

GRANT EXECUTE ON FUNCTION public.record_inventory_movement(jsonb) TO authenticated;
