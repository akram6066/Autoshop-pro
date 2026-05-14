-- ============================================================
-- 019_revoke_direct_writes.sql
-- Revokes direct INSERT/UPDATE/DELETE permissions from the 'authenticated' role
-- on business-critical tables. Forces all mutations to go through RPCs.
-- ============================================================

-- ─── 1. Revoke Permissions ───────────────────────────────────────────────────

-- Revoke all write permissions from authenticated role on data tables
REVOKE INSERT, UPDATE, DELETE ON public.sales            FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.sale_items       FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.stock_movements  FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.products         FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.customers        FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.customer_payments FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.shops            FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.shop_members     FROM authenticated;

-- Keep permissions on sync_queue as it's the client's local-first relay
-- Keep SELECT permissions for client-side reads

-- ─── 2. New RPC: manage_product ──────────────────────────────────────────────
-- Server-authoritative product management (upsert/delete)

CREATE OR REPLACE FUNCTION public.manage_product(
  p_op text, -- 'INSERT' | 'UPDATE' | 'DELETE'
  p_product jsonb
)
RETURNS uuid AS $$
DECLARE
  v_product_id uuid;
  v_shop_id    uuid;
BEGIN
  -- A) Validate Session
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  v_product_id := (p_product->>'id')::uuid;
  v_shop_id    := (p_product->>'shop_id')::uuid;

  -- B) Verify Shop Membership
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = v_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  -- C) Execute Operation
  IF p_op = 'INSERT' THEN
    INSERT INTO public.products (
      id, shop_id, room_id, name, sku, category, quantity, min_stock, price
    )
    VALUES (
      v_product_id, v_shop_id, (p_product->>'room_id')::uuid,
      p_product->>'name', p_product->>'sku', p_product->>'category',
      COALESCE((p_product->>'quantity')::integer, 0),
      COALESCE((p_product->>'min_stock')::integer, 5),
      COALESCE((p_product->>'price')::numeric, 0)
    )
    ON CONFLICT (id) DO NOTHING; -- Idempotency
    
  ELSIF p_op = 'UPDATE' THEN
    UPDATE public.products
    SET
      room_id = COALESCE((p_product->>'room_id')::uuid, room_id),
      name = COALESCE(p_product->>'name', name),
      sku = COALESCE(p_product->>'sku', sku),
      category = COALESCE(p_product->>'category', category),
      min_stock = COALESCE((p_product->>'min_stock')::integer, min_stock),
      price = COALESCE((p_product->>'price')::numeric, price),
      updated_at = now()
    WHERE id = v_product_id AND shop_id = v_shop_id;

  ELSIF p_op = 'DELETE' THEN
    -- Only owners can delete products
    IF NOT EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = v_shop_id AND user_id = auth.uid() AND role = 'owner'
    ) THEN
      RAISE EXCEPTION 'Only owners can delete products' USING ERRCODE = '42501';
    END IF;

    DELETE FROM public.products WHERE id = v_product_id AND shop_id = v_shop_id;
  END IF;

  RETURN v_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 3. New RPC: manage_customer ─────────────────────────────────────────────
-- Server-authoritative customer management

CREATE OR REPLACE FUNCTION public.manage_customer(
  p_op text,
  p_customer jsonb
)
RETURNS uuid AS $$
DECLARE
  v_customer_id uuid;
  v_shop_id     uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  v_customer_id := (p_customer->>'id')::uuid;
  v_shop_id     := (p_customer->>'shop_id')::uuid;

  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = v_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF p_op = 'INSERT' THEN
    INSERT INTO public.customers (id, shop_id, name, phone, email, address)
    VALUES (
      v_customer_id, v_shop_id,
      p_customer->>'name', p_customer->>'phone',
      p_customer->>'email', p_customer->>'address'
    )
    ON CONFLICT (id) DO NOTHING;

  ELSIF p_op = 'UPDATE' THEN
    UPDATE public.customers
    SET
      name = COALESCE(p_customer->>'name', name),
      phone = COALESCE(p_customer->>'phone', phone),
      email = COALESCE(p_customer->>'email', email),
      address = COALESCE(p_customer->>'address', address),
      updated_at = now()
    WHERE id = v_customer_id AND shop_id = v_shop_id;
  END IF;

  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 4. New RPC: record_stock_movement ──────────────────────────────────────────
-- Server-authoritative stock adjustment

CREATE OR REPLACE FUNCTION public.record_stock_movement(
  p_movement jsonb
)
RETURNS uuid AS $$
DECLARE
  v_movement_id uuid;
  v_shop_id     uuid;
  v_product_id  uuid;
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

  -- Lock product and apply immediately
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

  RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 5. Grant Execute Permissions ────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.manage_product(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manage_customer(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_sale(jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_customer_payment(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_stock_movement(jsonb) TO authenticated;
