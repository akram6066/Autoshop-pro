-- ============================================================
-- 058_sync_shops_plan_and_downgrade_cron.sql
--
-- 1. Trigger: keep shops.plan in sync when subscription changes.
--    Fixes the desync between subscriptions table and shops.plan
--    that caused limit-enforcement gaps.
--
-- 2. Function: expire_stale_subscriptions — downgrades expired
--    subscriptions and their shops.plan to 'free'.
--    Called by pg_cron daily (Pro plan) or manually via the
--    /api/admin/run-downgrade endpoint.
-- ============================================================

-- ─── 1. Sync function ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_shops_plan_on_subscription_change()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_name text;
  v_is_active boolean;
BEGIN
  -- Resolve the plan name and whether the subscription is active
  SELECT sp.name INTO v_plan_name
  FROM public.subscription_plans sp
  WHERE sp.id = NEW.plan_id;

  -- Active / free / trial with a non-expired trial → pro
  -- Expired / cancelled → free
  v_is_active := (
    NEW.is_admin_override = true
    OR NEW.status = 'free'
    OR NEW.status = 'trial'
    OR (NEW.status = 'active' AND (
          NEW.current_period_end IS NULL
          OR NEW.current_period_end > now()
        ))
  );

  UPDATE public.shops
  SET plan = CASE
    WHEN v_is_active AND v_plan_name IN ('pro', 'ultra_pro', 'free_forever') THEN v_plan_name
    WHEN v_is_active THEN 'pro'
    ELSE 'free'
  END
  WHERE id IN (
    SELECT shop_id FROM public.shop_members
    WHERE user_id = NEW.user_id AND role = 'owner'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_shops_plan ON public.subscriptions;
CREATE TRIGGER trg_sync_shops_plan
  AFTER INSERT OR UPDATE OF plan_id, status, is_admin_override, current_period_end
  ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_shops_plan_on_subscription_change();


-- ─── 2. Downgrade expired subscriptions ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.expire_stale_subscriptions()
RETURNS integer AS $$
DECLARE
  v_count integer := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT user_id FROM public.subscriptions
    WHERE status = 'active'
      AND current_period_end IS NOT NULL
      AND current_period_end < now()
      AND is_admin_override = false
  LOOP
    UPDATE public.subscriptions
    SET status = 'expired', updated_at = now()
    WHERE user_id = r.user_id;

    -- Sync shops.plan via the trigger above (fires automatically on UPDATE)
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.expire_stale_subscriptions() TO service_role;


-- ─── 3. pg_cron daily job (Pro plan only — safe to run on all tiers) ─────────
-- This block is wrapped in a DO so it doesn't fail if pg_cron extension is
-- not installed (Free plan Supabase projects).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule(
      'expire-stale-subscriptions',
      '0 1 * * *',  -- 01:00 UTC every day
      'SELECT public.expire_stale_subscriptions()'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron not available or already scheduled — ignore
  NULL;
END $$;
