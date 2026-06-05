BEGIN;

-- ============================================================
-- 064_expire_cancelled_subs.sql
--
-- expire_stale_subscriptions() in migration 062 only handles
-- 'active' and 'trial' rows. 'cancelled' subscriptions are
-- never touched, so shops.plan never gets downgraded after the
-- paid period ends for a cancelled user.
--
-- This migration adds a third loop that expires cancelled subs
-- past their current_period_end, which fires trg_sync_shops_plan
-- and correctly sets shops.plan → 'free'.
-- ============================================================

CREATE OR REPLACE FUNCTION public.expire_stale_subscriptions()
RETURNS integer AS $$
DECLARE
  v_count integer := 0;
  r RECORD;
BEGIN
  -- 1. Expire active subscriptions past current_period_end
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
    v_count := v_count + 1;
  END LOOP;

  -- 2. Expire paid-plan trials that ended > 24 hours ago without payment.
  FOR r IN
    SELECT s.user_id FROM public.subscriptions s
    JOIN public.subscription_plans sp ON sp.id = s.plan_id
    WHERE s.status = 'trial'
      AND s.trial_ends_at IS NOT NULL
      AND s.trial_ends_at < now() - INTERVAL '24 hours'
      AND sp.price_kes > 0
      AND s.is_admin_override = false
  LOOP
    UPDATE public.subscriptions
    SET status = 'expired', updated_at = now()
    WHERE user_id = r.user_id;
    v_count := v_count + 1;
  END LOOP;

  -- 3. Expire cancelled subscriptions past current_period_end.
  --    Without this, shops.plan never downgrades after a user cancels
  --    and their paid period ends, because trg_sync_shops_plan only
  --    fires on subscription row updates.
  FOR r IN
    SELECT user_id FROM public.subscriptions
    WHERE status = 'cancelled'
      AND current_period_end IS NOT NULL
      AND current_period_end < now()
      AND is_admin_override = false
  LOOP
    UPDATE public.subscriptions
    SET status = 'expired', updated_at = now()
    WHERE user_id = r.user_id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.expire_stale_subscriptions() TO service_role;

COMMIT;
