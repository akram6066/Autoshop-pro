-- ============================================================
-- 036_fix_sales_summary_live.sql
-- Migration 013 rewrote get_sales_summary to use mv_sales_daily
-- (a materialized view). The view only refreshes when /api/sync
-- is called, so today's sales are invisible until then.
--
-- Fix: always query the live sales table. The composite index
-- idx_sales_shop_date from 013 and idx_sales_shop_id from 001
-- make this fast even for 90-day windows.
-- ============================================================

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
  RETURN QUERY
  SELECT
    s.created_at::date                        AS date,
    COALESCE(SUM(s.total_amount), 0)::numeric AS total_revenue,
    COUNT(*)                                  AS order_count
  FROM public.sales s
  WHERE s.shop_id    = p_shop_id
    AND s.created_at >= p_from
    AND s.created_at <= p_to
  GROUP BY s.created_at::date
  ORDER BY date ASC;
END;
$$;
