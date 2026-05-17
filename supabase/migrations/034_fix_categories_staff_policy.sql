-- ============================================================
-- 034_fix_categories_staff_policy.sql
-- Migration 033's categories SELECT policy does a double JOIN on
-- shop_members, but shop_members RLS only lets staff see their own
-- row — so the owner JOIN (sm_owner) returns empty and EXISTS is
-- always false for staff.
--
-- Fix: a SECURITY DEFINER helper that bypasses shop_members RLS,
-- mirroring the pattern used in 028 for is_shop_owner().
-- ============================================================

-- Checks whether auth.uid() is a member of any shop where
-- p_owner_id is the owner. Runs as postgres (SECURITY DEFINER)
-- so it can see all shop_members rows without RLS interference.
CREATE OR REPLACE FUNCTION public.is_shopmate_of_owner(p_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shop_members sm_viewer
    JOIN public.shop_members sm_owner
      ON sm_owner.shop_id = sm_viewer.shop_id
    WHERE sm_viewer.user_id = auth.uid()
      AND sm_owner.user_id  = p_owner_id
      AND sm_owner.role     = 'owner'
  );
$$;

-- Drop the broken policy (its subquery hits shop_members RLS)
DROP POLICY IF EXISTS "staff can read shop owner categories" ON public.categories;

-- Re-create using the SECURITY DEFINER helper
CREATE POLICY "staff can read shop owner categories"
  ON public.categories FOR SELECT
  USING (public.is_shopmate_of_owner(owner_id));
