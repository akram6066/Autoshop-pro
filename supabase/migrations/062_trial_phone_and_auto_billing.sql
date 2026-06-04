BEGIN;

-- Add billing phone and auto-billing opt-in to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_phone              text,
  ADD COLUMN IF NOT EXISTS auto_bill_at_end           boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_billing_initiated_at  timestamptz;

-- Update expire_stale_subscriptions: also expire paid-plan trials
-- after a 24-hour grace period (so the billing cron has time to fire first).
CREATE OR REPLACE FUNCTION public.expire_stale_subscriptions()
RETURNS integer AS $$
DECLARE
  v_count integer := 0;
  r RECORD;
BEGIN
  -- Expire active subscriptions past current_period_end
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

  -- Expire paid-plan trials that ended > 24 hours ago without payment.
  -- The billing cron fires at trial_ends_at; this gives users 24 h to confirm
  -- their M-Pesa STK push before access is revoked.
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

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.expire_stale_subscriptions() TO service_role;

COMMIT;
