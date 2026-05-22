BEGIN;

-- ============================================================
-- 025_fix_category_limit_trigger.sql
-- Migration 014 created check_category_limit() referencing NEW.shop_id.
-- Migration 007 changed categories to use owner_id instead.
-- Fix the trigger function to use owner_id and look up plan via shop_members.
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_category_limit()
RETURNS trigger AS $$
DECLARE v_count int; v_plan text;
BEGIN
  SELECT s.plan INTO v_plan
  FROM public.shops s
  JOIN public.shop_members sm ON sm.shop_id = s.id
  WHERE sm.user_id = NEW.owner_id AND sm.role = 'owner'
  LIMIT 1;

  SELECT COUNT(*) INTO v_count
  FROM public.categories
  WHERE owner_id = NEW.owner_id;

  IF v_plan = 'free' AND v_count >= 10 THEN
    RAISE EXCEPTION 'category limit reached for free plan';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
