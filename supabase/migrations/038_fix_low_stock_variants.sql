BEGIN;

-- ============================================================
-- 038_fix_low_stock_variants.sql
-- Update get_low_stock_products to handle variant products.
-- Previously, variant parent products (quantity=0, min_stock=0)
-- always satisfied 0 <= 0 and flooded the low-stock list.
-- Now: simple products use products.quantity; variant products
-- surface individual low-stock sizes as separate rows.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_low_stock_products(p_shop_id uuid)
RETURNS TABLE (
  id        uuid,
  name      text,
  sku       text,
  quantity  integer,
  min_stock integer,
  room_id   uuid,
  category  text
) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY

  -- Simple products: no variants, stock below minimum
  SELECT
    p.id, p.name, p.sku,
    p.quantity, p.min_stock,
    p.room_id, p.category
  FROM public.products p
  WHERE p.shop_id = p_shop_id
    AND p.quantity <= p.min_stock
    AND NOT EXISTS (
      SELECT 1 FROM public.product_variants v WHERE v.product_id = p.id
    )

  UNION ALL

  -- Variant products: one row per low-stock size
  SELECT
    p.id,
    (p.name || ' — ' || pv.size)::text AS name,
    COALESCE(pv.sku, p.sku)::text       AS sku,
    pv.quantity,
    pv.min_stock,
    p.room_id,
    p.category
  FROM public.products p
  JOIN public.product_variants pv ON pv.product_id = p.id
  WHERE p.shop_id = p_shop_id
    AND pv.quantity <= pv.min_stock

  ORDER BY quantity ASC, name ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMIT;
