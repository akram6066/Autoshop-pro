BEGIN;

-- 1. Drop the old constraint if it exists
ALTER TABLE public.shops DROP CONSTRAINT IF EXISTS shops_plan_check;

-- 2. Add the new constraint allowing all valid plan values
-- 'free', 'trial', 'pro', 'ultra_pro', 'free_forever'
ALTER TABLE public.shops ADD CONSTRAINT shops_plan_check
  CHECK (plan IN ('free', 'trial', 'pro', 'ultra_pro', 'free_forever'));

-- 3. Update the trigger function sync_shops_plan_on_subscription_change
CREATE OR REPLACE FUNCTION public.sync_shops_plan_on_subscription_change()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_name text;
  v_is_active boolean;
BEGIN
  -- Resolve the plan name
  SELECT sp.name INTO v_plan_name
  FROM public.subscription_plans sp
  WHERE sp.id = NEW.plan_id;

  -- Resolve active state: admin_override, status free/trial/active (excluding expired/cancelled)
  v_is_active := (
    NEW.is_admin_override = true
    OR NEW.status = 'free'
    OR NEW.status = 'trial'
    OR (NEW.status = 'active' AND (
          NEW.current_period_end IS NULL
          OR NEW.current_period_end > now()
        ))
  );

  -- Set plan:
  -- - Active paid plans ('pro', 'ultra_pro', 'free_forever') -> set as is.
  -- - Active trial plan ('trial') -> mapped to 'free' so limits are enforced and reports/activity hidden.
  -- - Expired / Cancelled / anything else -> mapped to 'free'.
  UPDATE public.shops
  SET plan = CASE
    WHEN v_is_active AND v_plan_name IN ('pro', 'ultra_pro', 'free_forever') THEN v_plan_name
    ELSE 'free'
  END
  WHERE id IN (
    SELECT shop_id FROM public.shop_members
    WHERE user_id = NEW.user_id AND role = 'owner'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Backfill: sync existing shops to set plan = 'free' for active trial (Free plan) or expired subscriptions
UPDATE public.shops
SET plan = 'free'
WHERE id IN (
  SELECT sm.shop_id
  FROM public.shop_members sm
  JOIN public.subscriptions s ON s.user_id = sm.user_id
  JOIN public.subscription_plans sp ON sp.id = s.plan_id
  WHERE sm.role = 'owner'
    AND (
      s.is_admin_override = false
      AND s.status != 'free'
      AND (sp.name = 'trial' OR s.status = 'expired' OR s.status = 'cancelled')
    )
);

COMMIT;
