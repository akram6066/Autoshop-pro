-- Returns the top-selling products for a shop within a date range.
-- Used by the Reports page → Product Analytics section.
-- Excludes voided sales. Validates the caller is a member of the shop.

CREATE OR REPLACE FUNCTION public.get_product_analytics(
  p_shop_id uuid,
  p_from    timestamptz,
  p_to      timestamptz,
  p_limit   int DEFAULT 10
)
RETURNS TABLE (
  product_id   uuid,
  product_name text,
  category     text,
  units_sold   bigint,
  revenue      numeric
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    p.id                              AS product_id,
    p.name                            AS product_name,
    p.category                        AS category,
    SUM(si.quantity)::bigint          AS units_sold,
    SUM(si.quantity * si.unit_price)  AS revenue
  FROM  sale_items  si
  JOIN  sales       s  ON s.id  = si.sale_id
  JOIN  products    p  ON p.id  = si.product_id
  WHERE s.shop_id    = p_shop_id
    AND s.created_at >= p_from
    AND s.created_at <= p_to
    AND s.status IS DISTINCT FROM 'voided'
    AND EXISTS (
          SELECT 1
          FROM   shop_members sm
          WHERE  sm.shop_id = p_shop_id
            AND  sm.user_id = auth.uid()
        )
  GROUP BY p.id, p.name, p.category
  ORDER BY SUM(si.quantity * si.unit_price) DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_analytics(uuid, timestamptz, timestamptz, int)
  TO authenticated;
