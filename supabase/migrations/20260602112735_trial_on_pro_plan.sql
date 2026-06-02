-- Give every new shop a 30-day free trial of the Pro plan instead of the
-- basic Free Trial plan, so they experience full Pro features from day one.

CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER AS $$
DECLARE v_plan_id uuid;
BEGIN
  -- Use the Pro plan for the trial so new users get full Pro features
  SELECT id INTO v_plan_id
  FROM public.subscription_plans
  WHERE name = 'pro' AND is_active = true
  LIMIT 1;

  -- Fall back to the trial plan if Pro doesn't exist yet
  IF v_plan_id IS NULL THEN
    SELECT id INTO v_plan_id
    FROM public.subscription_plans
    WHERE name = 'trial' AND is_active = true
    LIMIT 1;
  END IF;

  IF v_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, plan_id, status, trial_ends_at)
    VALUES (NEW.id, v_plan_id, 'trial', now() + INTERVAL '30 days')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
