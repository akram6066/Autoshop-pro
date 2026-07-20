BEGIN;

ALTER TABLE public.sale_items
ADD COLUMN IF NOT EXISTS original_price numeric,
ADD COLUMN IF NOT EXISTS override_reason text;

DROP FUNCTION IF EXISTS public.get_sales_with_staff(uuid, int, int);

CREATE OR REPLACE FUNCTION public.get_sales_with_staff(
  p_shop_id  uuid,
  p_offset   int DEFAULT 0,
  p_limit    int DEFAULT 25
)
RETURNS TABLE (
  id               uuid,
  total_amount     numeric,
  payment_method   text,
  created_at       timestamptz,
  staff_name       text,
  total_count      bigint,
  status           text,
  amount_paid      numeric,
  delivery_address text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.total_amount,
    s.payment_method::text,
    s.created_at,
    COALESCE(p.full_name, 'Unknown') AS staff_name,
    COUNT(*) OVER ()                 AS total_count,
    s.status,
    s.amount_paid,
    s.delivery_address
  FROM public.sales s
  LEFT JOIN public.profiles p ON p.id = s.user_id
  WHERE s.shop_id = p_shop_id
  ORDER BY s.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_sales_with_staff(uuid, int, int) TO authenticated;

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
  v_original_price numeric;
  v_override_reason text;
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
    v_original_price := (v_item->>'original_price')::numeric;
    v_override_reason := v_item->>'override_reason';

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

      INSERT INTO public.sale_items (id, sale_id, product_id, variant_id, quantity, unit_price, original_price, override_reason)
      VALUES (
        COALESCE((v_item->>'id')::uuid, gen_random_uuid()),
        v_sale_id, v_product_id, v_variant_id, v_qty, v_unit_price, v_original_price, v_override_reason
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

      INSERT INTO public.sale_items (id, sale_id, product_id, quantity, unit_price, original_price, override_reason)
      VALUES (
        COALESCE((v_item->>'id')::uuid, gen_random_uuid()),
        v_sale_id, v_product_id, v_qty, v_unit_price, v_original_price, v_override_reason
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
