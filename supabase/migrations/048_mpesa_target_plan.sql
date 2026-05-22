ALTER TABLE mpesa_payments
ADD COLUMN IF NOT EXISTS target_plan_name text NOT NULL DEFAULT 'pro';
