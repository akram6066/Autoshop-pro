BEGIN;

-- ─── Fix void_sale to refund customer debt ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.void_sale(
  p_sale_id  uuid,
  p_shop_id  uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_item   record;
  v_customer_id uuid;
  v_total_amount numeric;
  v_amount_paid numeric;
  v_debt numeric;
BEGIN
  -- Only owners may void a sale
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id
      AND user_id = auth.uid()
      AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only shop owners can void sales' USING ERRCODE = '42501';
  END IF;

  -- Fetch and lock the sale row, reading customer and amount data
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

  -- Mark sale as voided
  UPDATE public.sales
  SET status = 'voided'
  WHERE id = p_sale_id AND shop_id = p_shop_id;

  -- Restore Customer Balance if debt was incurred
  IF v_customer_id IS NOT NULL THEN
    v_debt := COALESCE(v_total_amount, 0) - COALESCE(v_amount_paid, 0);
    IF v_debt > 0 THEN
      UPDATE public.customers
      SET balance = balance + v_debt,
          updated_at = now()
      WHERE id = v_customer_id AND shop_id = p_shop_id;
    END IF;
  END IF;

  -- Iterate through every item in the sale to restore stock individually
  FOR v_item IN (SELECT * FROM public.sale_items WHERE sale_id = p_sale_id)
  LOOP
    IF v_item.variant_id IS NOT NULL THEN
      -- Variant path: restore product_variants quantity
      UPDATE public.product_variants
      SET quantity = quantity + v_item.quantity
      WHERE id = v_item.variant_id;

      -- Insert variant-aware stock movement
      INSERT INTO public.stock_movements (
        shop_id, product_id, variant_id, type, delta, snapshot_qty,
        device_id, reason, user_id, synced
      )
      SELECT
        p_shop_id, v_item.product_id, v_item.variant_id, 'IN', v_item.quantity,
        pv.quantity, -- snapshot after restore
        'server-void', 'adjustment', auth.uid(), true
      FROM public.product_variants pv
      WHERE pv.id = v_item.variant_id;
      
    ELSE
      -- Legacy path: restore base products quantity
      UPDATE public.products
      SET quantity = quantity + v_item.quantity, updated_at = now()
      WHERE id = v_item.product_id AND shop_id = p_shop_id;

      -- Insert base product stock movement
      INSERT INTO public.stock_movements (
        shop_id, product_id, type, delta, snapshot_qty,
        device_id, reason, user_id, synced
      )
      SELECT
        p_shop_id, v_item.product_id, 'IN', v_item.quantity,
        p.quantity, -- snapshot after restore
        'server-void', 'adjustment', auth.uid(), true
      FROM public.products p
      WHERE p.id = v_item.product_id AND p.shop_id = p_shop_id;
      
    END IF;
  END LOOP;

END;
$$;

GRANT EXECUTE ON FUNCTION public.void_sale(uuid, uuid) TO authenticated;

COMMIT;
