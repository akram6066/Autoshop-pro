BEGIN;

-- ============================================================
-- 053_fix_variant_stock_movements.sql
-- Fixes record_stock_movement to correctly handle product variants
-- ============================================================

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
  v_current_qty integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  v_movement_id := COALESCE(NULLIF(p_movement->>'id', '')::uuid, gen_random_uuid());
  v_shop_id     := (p_movement->>'shop_id')::uuid;
  v_product_id  := (p_movement->>'product_id')::uuid;
  v_variant_id  := NULLIF(p_movement->>'variant_id', '')::uuid;
  v_delta       := (p_movement->>'delta')::integer;
  v_type        := (p_movement->>'type')::movement_type;

  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = v_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  -- Verify product belongs to shop
  IF NOT EXISTS (
    SELECT 1 FROM public.products
    WHERE id = v_product_id AND shop_id = v_shop_id
  ) THEN
    RAISE EXCEPTION 'Product does not belong to this shop' USING ERRCODE = '42501';
  END IF;

  -- Idempotency Check
  IF EXISTS (SELECT 1 FROM public.stock_movements WHERE id = v_movement_id) THEN
    RETURN v_movement_id;
  END IF;

  IF v_variant_id IS NOT NULL THEN
    -- ── Variant path ──────────────────────────────────────────────
    SELECT quantity INTO v_current_qty
    FROM public.product_variants
    WHERE id = v_variant_id AND product_id = v_product_id
    FOR UPDATE;

    IF v_current_qty IS NULL THEN
      RAISE EXCEPTION 'Variant not found' USING ERRCODE = 'P0001';
    END IF;

    IF v_type = 'OUT' AND v_current_qty < v_delta THEN
      RAISE EXCEPTION 'Insufficient stock' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.stock_movements (
      id, shop_id, product_id, variant_id, type, delta, snapshot_qty,
      device_id, reason, user_id, synced
    )
    VALUES (
      v_movement_id, v_shop_id, v_product_id, v_variant_id, v_type, v_delta,
      CASE WHEN v_type = 'IN' THEN v_current_qty + v_delta ELSE v_current_qty - v_delta END,
      COALESCE(p_movement->>'device_id', 'server'),
      COALESCE(p_movement->>'reason', 'adjustment')::movement_reason,
      auth.uid(),
      true
    );

    UPDATE public.product_variants
    SET quantity = CASE WHEN v_type = 'IN' THEN quantity + v_delta ELSE quantity - v_delta END
    WHERE id = v_variant_id;

  ELSE
    -- ── Legacy path ───────────────────────────────────────────────
    SELECT quantity INTO v_current_qty
    FROM public.products
    WHERE id = v_product_id AND shop_id = v_shop_id
    FOR UPDATE;

    IF v_type = 'OUT' AND v_current_qty < v_delta THEN
      RAISE EXCEPTION 'Insufficient stock' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.stock_movements (
      id, shop_id, product_id, type, delta, snapshot_qty,
      device_id, reason, user_id, synced
    )
    VALUES (
      v_movement_id, v_shop_id, v_product_id, v_type, v_delta,
      CASE WHEN v_type = 'IN' THEN v_current_qty + v_delta ELSE v_current_qty - v_delta END,
      COALESCE(p_movement->>'device_id', 'server'),
      COALESCE(p_movement->>'reason', 'adjustment')::movement_reason,
      auth.uid(),
      true
    );

    UPDATE public.products
    SET quantity = CASE WHEN v_type = 'IN' THEN quantity + v_delta ELSE quantity - v_delta END,
        updated_at = now()
    WHERE id = v_product_id;
  END IF;

  RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
