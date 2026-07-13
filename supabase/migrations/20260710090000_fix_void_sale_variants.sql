BEGIN;

-- ─── Fix void_sale to correctly handle variants and duplicate items ───
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

  -- Fetch and lock the sale row
  SELECT status INTO v_status
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

  -- Iterate through every item in the sale to restore stock individually
  -- This fixes the issue with multiple identical items in the same sale
  -- and correctly handles product variants.
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
