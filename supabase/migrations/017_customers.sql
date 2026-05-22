BEGIN;

-- ============================================================
-- 017_customers.sql
-- Customer accounts with balance tracking (credit / partial pay).
-- ============================================================

-- ─── 1. customers ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     uuid        NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  phone       text,
  balance     numeric     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_shop_id
  ON public.customers (shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_shop_balance
  ON public.customers (shop_id, balance);

-- ─── 2. customer_payments ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_payments (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id      uuid        NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_id  uuid        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  amount       numeric     NOT NULL CHECK (amount > 0),
  note         text,
  user_id      uuid        NOT NULL REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_payments_customer
  ON public.customer_payments (customer_id);

-- ─── 3. Extend sales ─────────────────────────────────────────────────────────

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS customer_id  uuid REFERENCES public.customers(id),
  ADD COLUMN IF NOT EXISTS amount_paid  numeric NOT NULL DEFAULT 0;

-- Backfill: every existing sale was fully paid
UPDATE public.sales
SET amount_paid = total_amount
WHERE amount_paid = 0;

-- Expand payment_method constraint to include 'partial'
ALTER TABLE public.sales
  DROP CONSTRAINT IF EXISTS sales_payment_method_check;
ALTER TABLE public.sales
  ADD CONSTRAINT sales_payment_method_check
    CHECK (payment_method IN ('cash', 'mpesa', 'credit', 'partial'));

CREATE INDEX IF NOT EXISTS idx_sales_customer_id
  ON public.sales (customer_id)
  WHERE customer_id IS NOT NULL;

-- ─── 4. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.customers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop members access customers"
  ON public.customers FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = customers.shop_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = customers.shop_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "shop members access customer payments"
  ON public.customer_payments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = customer_payments.shop_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = customer_payments.shop_id AND user_id = auth.uid()
    )
  );

-- ─── 5. record_sale (updated — handles customer debt atomically) ──────────────

CREATE OR REPLACE FUNCTION public.record_sale(
  p_sale  jsonb,
  p_items jsonb
)
RETURNS uuid AS $$
DECLARE
  v_sale_id      uuid;
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
  v_sale_id := (p_sale->>'id')::uuid;

  IF EXISTS (SELECT 1 FROM public.sales WHERE id = v_sale_id) THEN
    RETURN v_sale_id;
  END IF;

  v_total_amount := (p_sale->>'total_amount')::numeric;
  v_amount_paid  := coalesce((p_sale->>'amount_paid')::numeric, v_total_amount);
  v_customer_id  := nullif(p_sale->>'customer_id', '')::uuid;

  INSERT INTO public.sales (
    id, shop_id, user_id, total_amount, payment_method,
    delivery_address, customer_id, amount_paid, synced, created_at
  )
  VALUES (
    v_sale_id,
    (p_sale->>'shop_id')::uuid,
    (p_sale->>'user_id')::uuid,
    v_total_amount,
    coalesce(p_sale->>'payment_method', 'cash'),
    p_sale->>'delivery_address',
    v_customer_id,
    v_amount_paid,
    true,
    coalesce((p_sale->>'created_at')::timestamptz, now())
  );

  -- Deduct debt from customer balance (balance negative = owes money)
  v_debt := v_total_amount - v_amount_paid;
  IF v_customer_id IS NOT NULL AND v_debt > 0 THEN
    UPDATE public.customers
    SET balance = balance - v_debt
    WHERE id = v_customer_id;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty        := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;

    SELECT quantity INTO v_current_qty
    FROM public.products WHERE id = v_product_id FOR UPDATE;

    IF v_current_qty < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
    END IF;

    INSERT INTO public.sale_items (id, sale_id, product_id, quantity, unit_price)
    VALUES (
      coalesce((v_item->>'id')::uuid, gen_random_uuid()),
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
      (p_sale->>'shop_id')::uuid,
      v_product_id, 'OUT', v_qty, v_current_qty - v_qty,
      coalesce(p_sale->>'device_id', 'server'),
      'sale',
      (p_sale->>'user_id')::uuid,
      true
    );
  END LOOP;

  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 6. record_customer_payment ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.record_customer_payment(
  p_payment jsonb
)
RETURNS uuid AS $$
DECLARE
  v_payment_id  uuid;
  v_customer_id uuid;
  v_amount      numeric;
BEGIN
  v_payment_id  := coalesce(nullif(p_payment->>'id', '')::uuid, gen_random_uuid());
  v_customer_id := (p_payment->>'customer_id')::uuid;
  v_amount      := (p_payment->>'amount')::numeric;

  INSERT INTO public.customer_payments (
    id, shop_id, customer_id, amount, note, user_id, created_at
  )
  VALUES (
    v_payment_id,
    (p_payment->>'shop_id')::uuid,
    v_customer_id,
    v_amount,
    nullif(p_payment->>'note', ''),
    (p_payment->>'user_id')::uuid,
    coalesce((p_payment->>'created_at')::timestamptz, now())
  );

  -- Positive amount = customer paying back → balance increases toward 0
  UPDATE public.customers
  SET balance = balance + v_amount
  WHERE id = v_customer_id;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
