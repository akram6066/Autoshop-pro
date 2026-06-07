BEGIN;

-- Add billing_cycle column to subscriptions and mpesa_payments
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle text NOT NULL DEFAULT 'monthly'
  CHECK (billing_cycle IN ('monthly', 'annual'));

ALTER TABLE public.mpesa_payments
  ADD COLUMN IF NOT EXISTS billing_cycle text NOT NULL DEFAULT 'monthly'
  CHECK (billing_cycle IN ('monthly', 'annual'));

COMMIT;
