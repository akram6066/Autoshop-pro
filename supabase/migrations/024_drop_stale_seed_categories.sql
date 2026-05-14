-- ============================================================
-- 024_drop_stale_seed_categories.sql
-- Migration 004 created seed_default_categories(p_shop_id uuid) for the
-- shop-scoped categories table.  Migration 007 recreated categories with
-- owner_id and introduced a no-arg overload.  The old overload was never
-- dropped, causing the setup page to hit the wrong function.
-- ============================================================

DROP FUNCTION IF EXISTS public.seed_default_categories(uuid);
