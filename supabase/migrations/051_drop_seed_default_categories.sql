-- seed_default_categories() is no longer called from the app.
-- New shops start with no default categories.
DROP FUNCTION IF EXISTS public.seed_default_categories();
