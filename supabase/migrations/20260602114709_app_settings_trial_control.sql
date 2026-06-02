-- App-wide settings table. Admin-only via service role.
CREATE TABLE IF NOT EXISTS public.app_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
-- No public policies — only service role can read/write

-- Seed default trial settings: enabled, 30 days
INSERT INTO public.app_settings (key, value)
VALUES ('trial', '{"enabled": true, "days": 30}')
ON CONFLICT (key) DO NOTHING;

-- Update trigger to respect app_settings for trial duration and plan
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id       uuid;
  v_trial_enabled boolean;
  v_trial_days    integer;
  v_trial_ends_at timestamptz;
BEGIN
  SELECT
    (value ->> 'enabled')::boolean,
    (value ->> 'days')::integer
  INTO v_trial_enabled, v_trial_days
  FROM public.app_settings
  WHERE key = 'trial';

  IF v_trial_enabled IS NULL THEN v_trial_enabled := true; END IF;
  IF v_trial_days    IS NULL THEN v_trial_days    := 30;   END IF;

  IF v_trial_enabled THEN
    SELECT id INTO v_plan_id
    FROM public.subscription_plans
    WHERE name = 'pro' AND is_active = true
    LIMIT 1;

    v_trial_ends_at := now() + (v_trial_days || ' days')::interval;
  END IF;

  -- Fall back to basic trial plan when trial is disabled
  IF v_plan_id IS NULL THEN
    SELECT id INTO v_plan_id
    FROM public.subscription_plans
    WHERE name = 'trial' AND is_active = true
    LIMIT 1;

    v_trial_ends_at := NULL;
  END IF;

  IF v_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, plan_id, status, trial_ends_at)
    VALUES (NEW.id, v_plan_id, 'trial', v_trial_ends_at)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
