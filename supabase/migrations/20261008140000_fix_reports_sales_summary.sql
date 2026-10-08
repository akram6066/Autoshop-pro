-- Fix get_sales_summary to always use live sales table to ensure perfect accuracy
-- for both 7-day reports and real-time POS dashboard analytics.

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
BEGIN
  -- Always return live data to ensure accuracy for real-time reporting (7d/30d)
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
    AND EXISTS (
      SELECT 1 FROM public.shop_members sm
      WHERE sm.shop_id = p_shop_id
      AND sm.user_id = auth.uid()
    )
  GROUP BY s.created_at::date
  ORDER BY date ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_sales_summary(uuid, timestamptz, timestamptz) TO authenticated;
