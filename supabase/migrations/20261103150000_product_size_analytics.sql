-- Returns the size/variant breakdown for a specific product/brand within a date range.
-- Used by Reports -> Product Analytics when clicking a product/brand to show
-- which sizes are "walking" (fastest-moving/highest volume).
-- Excludes voided sales. Validates the caller is a member of the shop.

CREATE OR REPLACE FUNCTION public.get_product_size_analytics(
  p_shop_id    uuid,
  p_product_id uuid,
  p_from       timestamptz,
  p_to         timestamptz
)
RETURNS TABLE (
  variant_id    uuid,
  size          text,
  sku           text,
  current_stock integer,
  min_stock     integer,
  units_sold    bigint,
  revenue       numeric
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH sales_by_variant AS (
    SELECT
      si.variant_id,
      SUM(si.quantity)::bigint         AS units_sold,
      SUM(si.quantity * si.unit_price) AS revenue
    FROM  sale_items  si
    JOIN  sales       s  ON s.id  = si.sale_id
    WHERE s.shop_id     = p_shop_id
      AND si.product_id = p_product_id
      AND s.created_at >= p_from
      AND s.created_at <= p_to
      AND s.status IS DISTINCT FROM 'voided'
      AND EXISTS (
            SELECT 1
            FROM   shop_members sm
            WHERE  sm.shop_id = p_shop_id
              AND  sm.user_id = auth.uid()
          )
    GROUP BY si.variant_id
  ),
  variant_rows AS (
    -- Sizes defined in product_variants
    SELECT
      pv.id                             AS variant_id,
      pv.size                           AS size,
      pv.sku                            AS sku,
      pv.quantity                       AS current_stock,
      pv.min_stock                      AS min_stock,
      COALESCE(sbv.units_sold, 0)::bigint AS units_sold,
      COALESCE(sbv.revenue, 0)::numeric  AS revenue
    FROM product_variants pv
    LEFT JOIN sales_by_variant sbv ON sbv.variant_id = pv.id
    WHERE pv.product_id = p_product_id
  ),
  standard_rows AS (
    -- Any sales recorded without a variant_id (or if product has no variants)
    SELECT
      NULL::uuid                        AS variant_id,
      COALESCE(NULLIF(p.size, ''), 'Standard') AS size,
      p.sku                             AS sku,
      p.quantity                        AS current_stock,
      p.min_stock                       AS min_stock,
      COALESCE(sbv.units_sold, 0)::bigint AS units_sold,
      COALESCE(sbv.revenue, 0)::numeric  AS revenue
    FROM products p
    LEFT JOIN sales_by_variant sbv ON sbv.variant_id IS NULL
    WHERE p.id = p_product_id
      AND p.shop_id = p_shop_id
      AND (sbv.units_sold IS NOT NULL OR NOT EXISTS (
        SELECT 1 FROM product_variants WHERE product_id = p_product_id
      ))
  )
  SELECT * FROM variant_rows
  UNION ALL
  SELECT * FROM standard_rows
  ORDER BY units_sold DESC, revenue DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_size_analytics(uuid, uuid, timestamptz, timestamptz)
  TO authenticated;
