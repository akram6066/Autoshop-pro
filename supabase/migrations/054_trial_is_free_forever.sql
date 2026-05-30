-- The trial plan is now permanently free — no 30-day expiry.
-- Set trial_days = 0 to reflect this in the config.
-- Existing users with expired trial_ends_at are automatically
-- re-activated because isActive() no longer checks that date.
update public.subscription_plans
set trial_days = 0
where name = 'trial';
