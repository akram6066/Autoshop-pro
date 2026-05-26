-- Add admin-configurable annual discount percentage to subscription plans.
-- Default 20 matches the hardcoded value that was in the UI before this migration.
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS annual_discount_pct integer NOT NULL DEFAULT 20
    CHECK (annual_discount_pct >= 0 AND annual_discount_pct <= 100);
