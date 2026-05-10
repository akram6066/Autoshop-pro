-- ============================================================
-- 013_sales_summary_matview.sql
--
-- Materialized view for get_sales_summary performance.
--
-- Problem: get_sales_summary() does a full GROUP BY scan over the sales table
-- on every report page load. At 10k+ sales rows per shop this becomes slow
-- (300–800ms+). Reports are read-heavy and tolerate slight staleness.
--
-- Solution: a materialized view that pre-aggregates sales by (shop_id, date).
-- Refreshed every 5 minutes via pg_cron (available on Supabase Pro).
-- Falls back gracefully: the original RPC still works if the matview is empty.
--
-- IMPORTANT: pg_cron is only available on Supabase Pro plan.
-- On Free plan, refresh is triggered by the /api/sync endpoint instead
-- (see src/app/api/sync/route.ts — add a call to refresh_sales_summary()).
-- ============================================================

-- ─── 1. Composite index on sales (shop_id, date) ──────────────────────────────
-- Speeds up both the matview refresh and the fallback RPC.

CREATE INDEX IF NOT EXISTS idx_sales_shop_date
  ON public.sales (shop_id, (created_at::date));

-- ─── 2. Materialized view ─────────────────────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_sales_daily AS
SELECT
  shop_id,
  created_at::date AS sale_date,
  SUM(total_amount)  AS total_revenue,
  COUNT(*)           AS order_count,
  AVG(total_amount)  AS avg_order_value
FROM public.sales
GROUP BY shop_id, created_at::date
WITH DATA;

-- Index for fast per-shop date-range queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sales_daily_shop_date
  ON public.mv_sales_daily (shop_id, sale_date);

-- ─── 3. Refresh function (callable by pg_cron and /api/sync) ─────────────────

CREATE OR REPLACE FUNCTION public.refresh_sales_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_sales_daily;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only authenticated users can trigger a refresh (called from /api/sync)
REVOKE ALL ON FUNCTION public.refresh_sales_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_sales_summary() TO authenticated;

-- ─── 4. Fast RPC using the materialized view ──────────────────────────────────
-- Replaces (or supplements) get_sales_summary() from migration 003.
-- Falls back to the live table if the matview hasn't been populated yet.

CREATE OR REPLACE FUNCTION public.get_sales_summary(
  p_shop_id uuid,
  p_from    timestamptz,
  p_to      timestamptz
)
RETURNS TABLE (
  date           date,
  total_revenue  numeric,
  order_count    bigint
) AS $$
DECLARE
  v_from_date date := p_from::date;
  v_to_date   date := p_to::date;
  v_matview_count bigint;
BEGIN
  -- Check if the matview has data for this shop
  SELECT COUNT(*) INTO v_matview_count
  FROM public.mv_sales_daily
  WHERE shop_id = p_shop_id;

  IF v_matview_count > 0 THEN
    -- Fast path: serve from matview
    RETURN QUERY
    SELECT
      mv.sale_date           AS date,
      mv.total_revenue::numeric,
      mv.order_count
    FROM public.mv_sales_daily mv
    WHERE mv.shop_id  = p_shop_id
      AND mv.sale_date BETWEEN v_from_date AND v_to_date
    ORDER BY mv.sale_date ASC;
  ELSE
    -- Fallback: live table scan (matview not yet populated)
    RETURN QUERY
    SELECT
      s.created_at::date       AS date,
      COALESCE(SUM(s.total_amount), 0)::numeric AS total_revenue,
      COUNT(*)                 AS order_count
    FROM public.sales s
    WHERE s.shop_id    = p_shop_id
      AND s.created_at >= p_from
      AND s.created_at <= p_to
    GROUP BY s.created_at::date
    ORDER BY date ASC;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─── 5. pg_cron schedule (Supabase Pro only) ─────────────────────────────────
-- Uncomment after enabling pg_cron in Supabase dashboard:
-- Extensions → pg_cron → Enable
--
-- SELECT cron.schedule(
--   'refresh-sales-summary',   -- job name
--   '*/5 * * * *',             -- every 5 minutes
--   'SELECT public.refresh_sales_summary()'
-- );
--
-- To verify: SELECT * FROM cron.job;
-- To remove:  SELECT cron.unschedule('refresh-sales-summary');
