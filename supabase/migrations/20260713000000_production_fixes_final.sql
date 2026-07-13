BEGIN;

-- ============================================================
-- 20260713000000_production_fixes_final.sql
-- 
-- 1. Financial Integrity: Update mv_sales_daily and get_sales_summary
--    to exclude voided sales.
-- 2. Offline Overselling: Drop the quantity >= 0 constraints to
--    allow negative inventory when a physical offline sale occurred.
-- ============================================================

-- ─── 1. Drop positive-inventory constraints ───────────────────────────

-- Drop constraints conditionally
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN 
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.products'::regclass AND contype = 'c' AND conname LIKE '%quantity%'
  LOOP
    EXECUTE 'ALTER TABLE public.products DROP CONSTRAINT ' || r.conname;
  END LOOP;
  
  FOR r IN 
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.product_variants'::regclass AND contype = 'c' AND conname LIKE '%quantity%'
  LOOP
    EXECUTE 'ALTER TABLE public.product_variants DROP CONSTRAINT ' || r.conname;
  END LOOP;
END;
$$;

-- ─── 2. Financial Integrity (Dashboard/Reports) ─────────────────────────

-- Recreate the materialized view to filter status
DROP MATERIALIZED VIEW IF EXISTS public.mv_sales_daily;

CREATE MATERIALIZED VIEW public.mv_sales_daily AS
SELECT
  shop_id,
  created_at::date AS sale_date,
  SUM(total_amount)  AS total_revenue,
  COUNT(*)           AS order_count,
  AVG(total_amount)  AS avg_order_value
FROM public.sales
WHERE status = 'completed' OR status IS NULL
GROUP BY shop_id, created_at::date
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sales_daily_shop_date
  ON public.mv_sales_daily (shop_id, sale_date);

-- Update the live fallback function
CREATE OR REPLACE FUNCTION public.get_sales_summary(
  p_shop_id uuid,
  p_from    timestamptz,
  p_to      timestamptz
)
RETURNS TABLE (
  date           date,
  total_revenue  numeric,
  order_count    bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_date date := p_from::date;
  v_to_date   date := p_to::date;
  v_matview_count bigint;
BEGIN
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
      s.created_at::date                        AS date,
      COALESCE(SUM(s.total_amount), 0)::numeric AS total_revenue,
      COUNT(*)                                  AS order_count
    FROM public.sales s
    WHERE s.shop_id    = p_shop_id
      AND s.created_at >= p_from
      AND s.created_at <= p_to
      AND (s.status = 'completed' OR s.status IS NULL)
    GROUP BY s.created_at::date
    ORDER BY date ASC;
  END IF;
END;
$$;

-- ─── 3. Update record_sale to allow negative inventory ─────────────────

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
  v_variant_id   uuid;
  v_qty          integer;
  v_unit_price   numeric;
  v_current_qty  integer;
  v_customer_id  uuid;
  v_total_amount numeric;
  v_amount_paid  numeric;
  v_debt         numeric;
  v_idempotency_key text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  v_sale_id := (p_sale->>'id')::uuid;
  v_shop_id := (p_sale->>'shop_id')::uuid;
  v_idempotency_key := p_sale->>'idempotency_key';

  -- Idempotency check 1: UUID (client generated)
  IF EXISTS (SELECT 1 FROM public.sales WHERE id = v_sale_id) THEN
    RETURN v_sale_id;
  END IF;

  -- Idempotency check 2: idempotency_key from payload (if provided)
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
    delivery_address, customer_id, amount_paid, synced, created_at, idempotency_key, status
  )
  VALUES (
    v_sale_id, v_shop_id, auth.uid(), v_total_amount,
    COALESCE(p_sale->>'payment_method', 'cash'),
    p_sale->>'delivery_address',
    v_customer_id, v_amount_paid, true,
    COALESCE((p_sale->>'created_at')::timestamptz, now()),
    v_idempotency_key,
    COALESCE(p_sale->>'status', 'completed')
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

    IF v_variant_id IS NOT NULL THEN
      -- ── Variant path: deduct from product_variants.quantity ──────────────
      SELECT quantity INTO v_current_qty
      FROM public.product_variants
      WHERE id = v_variant_id AND product_id = v_product_id
      FOR UPDATE;

      IF v_current_qty IS NULL THEN
        RAISE EXCEPTION 'Variant % not found for product %', v_variant_id, v_product_id;
      END IF;
      -- (RAISE EXCEPTION 'Insufficient stock' REMOVED to allow negative stock)

      INSERT INTO public.sale_items (id, sale_id, product_id, variant_id, quantity, unit_price)
      VALUES (
        COALESCE((v_item->>'id')::uuid, gen_random_uuid()),
        v_sale_id, v_product_id, v_variant_id, v_qty, v_unit_price
      );

      UPDATE public.product_variants
      SET quantity = quantity - v_qty
      WHERE id = v_variant_id;

      INSERT INTO public.stock_movements (
        shop_id, product_id, variant_id, type, delta, snapshot_qty,
        device_id, reason, user_id, synced
      )
      VALUES (
        v_shop_id, v_product_id, v_variant_id, 'OUT', v_qty,
        v_current_qty - v_qty,
        COALESCE(p_sale->>'device_id', 'server'),
        'sale', auth.uid(), true
      );

    ELSE
      -- ── Legacy path: deduct from products.quantity ───────────────────────
      SELECT quantity INTO v_current_qty
      FROM public.products
      WHERE id = v_product_id AND shop_id = v_shop_id
      FOR UPDATE;

      IF v_current_qty IS NULL THEN
        RAISE EXCEPTION 'Product % not found in this shop', v_product_id;
      END IF;
      -- (RAISE EXCEPTION 'Insufficient stock' REMOVED to allow negative stock)

      INSERT INTO public.sale_items (id, sale_id, product_id, quantity, unit_price)
      VALUES (
        COALESCE((v_item->>'id')::uuid, gen_random_uuid()),
        v_sale_id, v_product_id, v_qty, v_unit_price
      );

      UPDATE public.products
      SET quantity = quantity - v_qty, updated_at = now()
      WHERE id = v_product_id;

      INSERT INTO public.stock_movements (
        shop_id, product_id, type, delta, snapshot_qty,
        device_id, reason, user_id, synced
      )
      VALUES (
        v_shop_id, v_product_id, 'OUT', v_qty, v_current_qty - v_qty,
        COALESCE(p_sale->>'device_id', 'server'),
        'sale', auth.uid(), true
      );
    END IF;

  END LOOP;

  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
