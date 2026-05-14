-- ============================================================
-- 018_rpc_security_refactor.sql
-- Refactors critical SECURITY DEFINER RPCs to enforce:
-- 1. auth.uid() validation (No trust in payload user_id)
-- 2. shop_members membership validation (Tenant isolation)
-- 3. Idempotency (Prevent double-processing)
-- 4. Entity ownership validation (Products/Customers belong to the shop)
-- ============================================================

-- ─── 1. record_sale ──────────────────────────────────────────────────────────
-- Refactored to enforce membership and entity ownership.
-- Signature remains same to avoid breaking frontend, but p_sale->'user_id' is ignored.

CREATE OR REPLACE FUNCTION public.record_sale(
  p_sale  jsonb,
  p_items jsonb
)
RETURNS uuid AS $$
DECLARE
  v_sale_id      uuid;
  v_shop_id      uuid;
  v_item         jsonb;
  v_product_id   uuid;
  v_qty          integer;
  v_unit_price   numeric;
  v_current_qty  integer;
  v_customer_id  uuid;
  v_total_amount numeric;
  v_amount_paid  numeric;
  v_debt         numeric;
BEGIN
  -- A) Validate Session
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  v_sale_id := (p_sale->>'id')::uuid;
  v_shop_id := (p_sale->>'shop_id')::uuid;

  -- B) Idempotency Check (Concurrency safe)
  IF EXISTS (SELECT 1 FROM public.sales WHERE id = v_sale_id) THEN
    RETURN v_sale_id;
  END IF;

  -- C) Verify Shop Membership (Tenant Breakout Prevention)
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = v_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for this shop' USING ERRCODE = '42501';
  END IF;

  v_total_amount := (p_sale->>'total_amount')::numeric;
  v_amount_paid  := COALESCE((p_sale->>'amount_paid')::numeric, v_total_amount);
  v_customer_id  := NULLIF(p_sale->>'customer_id', '')::uuid;

  -- D) Verify Customer ownership (if applicable)
  IF v_customer_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = v_customer_id AND shop_id = v_shop_id
    ) THEN
      RAISE EXCEPTION 'Customer does not belong to this shop' USING ERRCODE = '42501';
    END IF;
  END IF;

  -- E) Insert Sale (Force auth.uid() as user_id)
  INSERT INTO public.sales (
    id, shop_id, user_id, total_amount, payment_method,
    delivery_address, customer_id, amount_paid, synced, created_at
  )
  VALUES (
    v_sale_id,
    v_shop_id,
    auth.uid(),
    v_total_amount,
    COALESCE(p_sale->>'payment_method', 'cash'),
    p_sale->>'delivery_address',
    v_customer_id,
    v_amount_paid,
    true,
    COALESCE((p_sale->>'created_at')::timestamptz, now())
  );

  -- F) Atomic Debt Update
  v_debt := v_total_amount - v_amount_paid;
  IF v_customer_id IS NOT NULL AND v_debt > 0 THEN
    UPDATE public.customers
    SET balance = balance - v_debt,
        updated_at = now()
    WHERE id = v_customer_id;
  END IF;

  -- G) Process Items + Stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty        := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;

    -- Verify Product ownership + Row Lock (Prevents Race Conditions)
    SELECT quantity INTO v_current_qty
    FROM public.products 
    WHERE id = v_product_id AND shop_id = v_shop_id
    FOR UPDATE;

    IF v_current_qty IS NULL THEN
      RAISE EXCEPTION 'Product % not found in this shop', v_product_id;
    END IF;

    IF v_current_qty < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
    END IF;

    -- H) Insert Sale Item
    INSERT INTO public.sale_items (id, sale_id, product_id, quantity, unit_price)
    VALUES (
      COALESCE((v_item->>'id')::uuid, gen_random_uuid()),
      v_sale_id, v_product_id, v_qty, v_unit_price
    );

    -- I) Update Stock
    UPDATE public.products
    SET quantity = quantity - v_qty,
        updated_at = now()
    WHERE id = v_product_id;

    -- J) Record Movement (Delta-based)
    INSERT INTO public.stock_movements (
      shop_id, product_id, type, delta, snapshot_qty,
      device_id, reason, user_id, synced
    )
    VALUES (
      v_shop_id,
      v_product_id, 'OUT', v_qty, v_current_qty - v_qty,
      COALESCE(p_sale->>'device_id', 'server'),
      'sale',
      auth.uid(),
      true
    );
  END LOOP;

  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 2. record_customer_payment ──────────────────────────────────────────────
-- Added idempotency and membership validation.

CREATE OR REPLACE FUNCTION public.record_customer_payment(
  p_payment jsonb
)
RETURNS uuid AS $$
DECLARE
  v_payment_id  uuid;
  v_shop_id     uuid;
  v_customer_id uuid;
  v_amount      numeric;
BEGIN
  -- A) Validate Session
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  v_payment_id  := COALESCE(NULLIF(p_payment->>'id', '')::uuid, gen_random_uuid());
  v_shop_id     := (p_payment->>'shop_id')::uuid;
  v_customer_id := (p_payment->>'customer_id')::uuid;
  v_amount      := (p_payment->>'amount')::numeric;

  -- B) Idempotency Check
  IF EXISTS (SELECT 1 FROM public.customer_payments WHERE id = v_payment_id) THEN
    RETURN v_payment_id;
  END IF;

  -- C) Verify Shop Membership
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = v_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for this shop' USING ERRCODE = '42501';
  END IF;

  -- D) Verify Customer Ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = v_customer_id AND shop_id = v_shop_id
  ) THEN
    RAISE EXCEPTION 'Customer does not belong to this shop' USING ERRCODE = '42501';
  END IF;

  -- E) Insert Payment (Force auth.uid())
  INSERT INTO public.customer_payments (
    id, shop_id, customer_id, amount, note, user_id, created_at
  )
  VALUES (
    v_payment_id,
    v_shop_id,
    v_customer_id,
    v_amount,
    NULLIF(p_payment->>'note', ''),
    auth.uid(),
    COALESCE((p_payment->>'created_at')::timestamptz, now())
  );

  -- F) Atomic Balance Update
  UPDATE public.customers
  SET balance = balance + v_amount,
      updated_at = now()
  WHERE id = v_customer_id;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 3. setup_owner_shop ─────────────────────────────────────────────────────
-- Enforces p_user_id == auth.uid().

CREATE OR REPLACE FUNCTION public.setup_owner_shop(
  p_user_id uuid,
  p_shop_name text,
  p_shop_address text,
  p_full_name text
)
RETURNS uuid AS $$
DECLARE
  v_shop_id uuid;
BEGIN
  -- A) Prevent Setting Up Shop For Others
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot setup shop for another user' USING ERRCODE = '42501';
  END IF;

  -- B) Update profile name
  UPDATE public.profiles
  SET full_name = p_full_name
  WHERE id = p_user_id;

  -- C) Create the shop
  INSERT INTO public.shops (name, address)
  VALUES (p_shop_name, p_shop_address)
  RETURNING id INTO v_shop_id;

  -- D) Add owner to shop_members
  INSERT INTO public.shop_members (shop_id, user_id, role)
  VALUES (v_shop_id, p_user_id, 'owner');

  -- E) Sync profile active shop and role
  UPDATE public.profiles
  SET shop_id = v_shop_id, role = 'owner'
  WHERE id = p_user_id;

  RETURN v_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 4. get_sales_summary ─────────────────────────────────────────────────────
-- Added membership check to prevent cross-tenant data leaks.

CREATE OR REPLACE FUNCTION public.get_sales_summary(
  p_shop_id uuid,
  p_from    timestamptz,
  p_to      timestamptz
)
RETURNS TABLE (
  date           date,
  total_revenue  numeric,
  order_count    bigint
) AS $$
DECLARE
  v_from_date date := p_from::date;
  v_to_date   date := p_to::date;
  v_matview_count bigint;
BEGIN
  -- A) Verify Membership
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  -- B) Check if the matview has data for this shop
  SELECT COUNT(*) INTO v_matview_count
  FROM public.mv_sales_daily
  WHERE shop_id = p_shop_id;

  IF v_matview_count > 0 THEN
    RETURN QUERY
    SELECT
      mv.sale_date           AS date,
      mv.total_revenue::numeric,
      mv.order_count
    FROM public.mv_sales_daily mv
    WHERE mv.shop_id  = p_shop_id
      AND mv.sale_date BETWEEN v_from_date AND v_to_date
    ORDER BY mv.sale_date ASC;
  ELSE
    RETURN QUERY
    SELECT
      s.created_at::date       AS date,
      COALESCE(SUM(s.total_amount), 0)::numeric AS total_revenue,
      COUNT(*)                 AS order_count
    FROM public.sales s
    WHERE s.shop_id    = p_shop_id
      AND s.created_at >= p_from
      AND s.created_at <= p_to
    GROUP BY s.created_at::date
    ORDER BY date ASC;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ─── 5. get_low_stock_products ───────────────────────────────────────────────
-- Added membership check.

CREATE OR REPLACE FUNCTION public.get_low_stock_products(p_shop_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  sku text,
  quantity integer,
  min_stock integer,
  room_id uuid,
  category text
) AS $$
BEGIN
  -- A) Verify Membership
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT p.id, p.name, p.sku, p.quantity, p.min_stock, p.room_id, p.category
  FROM public.products p
  WHERE p.shop_id = p_shop_id
    AND p.quantity <= p.min_stock
  ORDER BY p.quantity ASC, p.name ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ─── 6. apply_stock_deltas ────────────────────────────────────────────────────
-- Added product-level membership check.

CREATE OR REPLACE FUNCTION public.apply_stock_deltas(p_product_id uuid)
RETURNS void AS $$
DECLARE
  v_net_delta integer;
  v_shop_id   uuid;
BEGIN
  -- A) Identify Shop and Verify Membership
  SELECT shop_id INTO v_shop_id FROM public.products WHERE id = p_product_id;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = v_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  -- B) Process Deltas
  SELECT
    SUM(CASE WHEN type = 'IN' THEN delta ELSE -delta END)
  INTO v_net_delta
  FROM public.stock_movements
  WHERE product_id = p_product_id
    AND synced = false;

  IF v_net_delta IS NOT NULL AND v_net_delta != 0 THEN
    UPDATE public.products
    SET
      quantity = GREATEST(0, quantity + v_net_delta),
      updated_at = now()
    WHERE id = p_product_id;

    UPDATE public.stock_movements
    SET synced = true
    WHERE product_id = p_product_id
      AND synced = false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 7. switch_active_shop ────────────────────────────────────────────────────
-- Hardened with session validation and consistent error codes.

CREATE OR REPLACE FUNCTION public.switch_active_shop(p_shop_id uuid)
RETURNS void AS $$
BEGIN
  -- A) Validate Session
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  -- B) Verify Membership
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this shop' USING ERRCODE = '42501';
  END IF;

  -- C) Update Profile
  UPDATE public.profiles
  SET shop_id = p_shop_id
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
