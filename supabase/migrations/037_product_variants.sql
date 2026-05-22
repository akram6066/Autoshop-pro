BEGIN;

-- ============================================================
-- 037_product_variants.sql
-- Adds per-size variants to products.
-- One parent product (brand) → many product_variants (sizes).
-- Backwards compatible: products without variants continue to
-- use products.quantity / products.price unchanged.
-- ============================================================

-- ─── 1. product_variants table ────────────────────────────────────────────────

CREATE TABLE public.product_variants (
  id         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid          NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size       text          NOT NULL,
  sku        text,
  price      numeric(12,2) NOT NULL DEFAULT 0,
  quantity   integer       NOT NULL DEFAULT 0,
  min_stock  integer       NOT NULL DEFAULT 0,
  created_at timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (product_id, size)
);

CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- RLS: scoped to the shop that owns the parent product
CREATE POLICY "shop members can view product variants"
  ON public.product_variants FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM public.products WHERE shop_id = public.auth_shop_id()
    )
  );

CREATE POLICY "shop members can insert product variants"
  ON public.product_variants FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT id FROM public.products WHERE shop_id = public.auth_shop_id()
    )
  );

CREATE POLICY "shop members can update product variants"
  ON public.product_variants FOR UPDATE
  USING (
    product_id IN (
      SELECT id FROM public.products WHERE shop_id = public.auth_shop_id()
    )
  );

CREATE POLICY "shop members can delete product variants"
  ON public.product_variants FOR DELETE
  USING (
    product_id IN (
      SELECT id FROM public.products WHERE shop_id = public.auth_shop_id()
    )
  );

-- ─── 2. Add variant_id to sale_items ─────────────────────────────────────────
-- Nullable: existing rows (non-variant sales) remain valid.

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS variant_id uuid
  REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- ─── 3. Add variant_id to stock_movements ────────────────────────────────────

ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS variant_id uuid
  REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- ─── 4. Updated record_sale — supports both variant and non-variant items ─────

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
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  v_sale_id := (p_sale->>'id')::uuid;
  v_shop_id := (p_sale->>'shop_id')::uuid;

  IF EXISTS (SELECT 1 FROM public.sales WHERE id = v_sale_id) THEN
    RETURN v_sale_id;
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
    delivery_address, customer_id, amount_paid, synced, created_at
  )
  VALUES (
    v_sale_id, v_shop_id, auth.uid(), v_total_amount,
    COALESCE(p_sale->>'payment_method', 'cash'),
    p_sale->>'delivery_address',
    v_customer_id, v_amount_paid, true,
    COALESCE((p_sale->>'created_at')::timestamptz, now())
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
      IF v_current_qty < v_qty THEN
        RAISE EXCEPTION 'Insufficient stock for variant %', v_variant_id;
      END IF;

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
      IF v_current_qty < v_qty THEN
        RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
      END IF;

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
