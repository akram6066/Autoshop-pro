BEGIN;

-- ============================================================
-- 028_fix_shop_members_rls.sql
-- Fix infinite recursion in shop_members RLS policies.
--
-- Root cause (migration 004): "owners can view all members of their shop"
-- and "owners can remove members" both query shop_members from within a
-- policy ON shop_members. PostgreSQL applies RLS recursively, so the
-- subquery triggers the same policy → infinite loop.
--
-- Fix: a SECURITY DEFINER function that runs as the function owner
-- (bypassing RLS), breaking the cycle.
-- ============================================================

-- Helper that checks ownership without triggering shop_members RLS.
-- SECURITY DEFINER runs as the defining role (postgres), not the caller,
-- so it reads shop_members directly without policy evaluation.
CREATE OR REPLACE FUNCTION public.is_shop_owner(p_shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id
      AND user_id = auth.uid()
      AND role = 'owner'
  );
$$;

-- ── Rewrite the two self-referential SELECT / DELETE policies ─────────────────

DROP POLICY IF EXISTS "owners can view all members of their shop" ON public.shop_members;
CREATE POLICY "owners can view all members of their shop"
  ON public.shop_members FOR SELECT
  USING (public.is_shop_owner(shop_id));

DROP POLICY IF EXISTS "owners can remove members" ON public.shop_members;
CREATE POLICY "owners can remove members"
  ON public.shop_members FOR DELETE
  USING (public.is_shop_owner(shop_id));

COMMIT;
