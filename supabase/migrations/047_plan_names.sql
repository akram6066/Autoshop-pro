BEGIN;

-- Rename trial plan display name from "Free Trial" to "Free"
UPDATE subscription_plans
SET display_name = 'Free'
WHERE name = 'trial';

-- Add Ultra Pro plan (unlimited everything, KES 2,500/mo)
INSERT INTO subscription_plans (
  name, display_name, price_kes, trial_days,
  max_shops, max_products_per_shop, max_staff_per_shop, max_sales_per_month
)
VALUES (
  'ultra_pro', 'Ultra Pro', 2500, 0,
  999999, 999999, 999999, 999999
)
ON CONFLICT (name) DO UPDATE SET
  display_name  = EXCLUDED.display_name,
  price_kes     = EXCLUDED.price_kes;

COMMIT;
