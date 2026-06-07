-- Update subscription_plans row for 'ultra_pro' to be displayed as 'Big Companies'
UPDATE public.subscription_plans
SET display_name = 'Big Companies'
WHERE name = 'ultra_pro';
