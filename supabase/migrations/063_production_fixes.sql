BEGIN;

-- ============================================================
-- 063_production_fixes.sql
--
-- 1. Fix check_product_limit — Ultra Pro and free_forever shops
--    were incorrectly capped at 50 products (free-tier limit).
--    Only 'pro' was whitelisted; 'ultra_pro' and 'free_forever'
--    must also bypass the limit.
--
-- 2. Fix check_sales_monthly_limit — same gap: 'ultra_pro' and
--    'free_forever' were capped at 100 sales/month.
--
-- 3. Definitively set Ultra Pro plan limits to unlimited (999999)
--    using UPDATE so migration-execution-order cannot affect it.
--    Migrations 047 (upsert) and 053 (do nothing) produced
--    different results depending on which ran first.
--
-- 4. Unschedule the legacy expire-trials-daily pg_cron job
--    (migration 049). expire_stale_subscriptions() in migration
--    058 is a strict superset; running both doubles work.
--
-- 5. Schedule prune_old_data() weekly so audit_logs, sync_queue,
--    and shop_invites do not grow without bound.
-- ============================================================


-- ─── 1. Fix check_product_limit ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_product_limit()
RETURNS trigger AS $$
DECLARE v_count int; v_plan text;
BEGIN
  SELECT plan INTO v_plan FROM public.shops WHERE id = NEW.shop_id;
  -- Paid plans (pro, ultra_pro) and admin-overridden free_forever are unlimited
  IF v_plan IN ('pro', 'ultra_pro', 'free_forever') THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO v_count FROM public.products WHERE shop_id = NEW.shop_id;
  IF v_count >= 50 THEN
    RAISE EXCEPTION 'product_limit_reached: free plan allows 50 products per shop';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ─── 2. Fix check_sales_monthly_limit ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_sales_monthly_limit()
RETURNS trigger AS $$
DECLARE v_count int; v_plan text; v_month_start timestamptz;
BEGIN
  SELECT plan INTO v_plan FROM public.shops WHERE id = NEW.shop_id;
  -- Paid plans and admin-overridden free_forever are unlimited
  IF v_plan IN ('pro', 'ultra_pro', 'free_forever') THEN RETURN NEW; END IF;
  v_month_start := date_trunc('month', now());
  SELECT COUNT(*) INTO v_count
  FROM public.sales
  WHERE shop_id = NEW.shop_id AND created_at >= v_month_start;
  IF v_count >= 100 THEN
    RAISE EXCEPTION 'sales_monthly_limit_reached: free plan allows 100 sales per month';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ─── 3. Definitively set Ultra Pro plan limits to unlimited ───────────────────
-- Uses UPDATE (not upsert / on conflict do nothing) so this always wins
-- regardless of which earlier seed migration ran first.

UPDATE public.subscription_plans SET
  max_shops              = 999999,
  max_products_per_shop  = 999999,
  max_staff_per_shop     = 999999,
  max_sales_per_month    = 999999
WHERE name = 'ultra_pro';


-- ─── 4. Unschedule legacy expire-trials-daily job (migration 049) ────────────
-- expire_stale_subscriptions() (migration 058 + 062) supersedes expire_trials().
-- Running both is harmless (idempotent) but wasteful.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('expire-trials-daily');
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- job may not exist on this database instance
END $$;


-- ─── 5. Schedule prune_old_data weekly ───────────────────────────────────────
-- Migration 042 created the function but left the schedule commented out.
-- Runs every Sunday at 03:00 UTC (low-traffic window).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Replace if already scheduled (idempotent)
    PERFORM cron.unschedule('prune-old-data');
    PERFORM cron.schedule(
      'prune-old-data',
      '0 3 * * 0',
      $$ SELECT public.prune_old_data() $$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

COMMIT;
