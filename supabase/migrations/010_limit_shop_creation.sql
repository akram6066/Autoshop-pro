BEGIN;

-- ============================================================
-- 010_limit_shop_creation.sql
-- Limit each user to a maximum of 10 shops as owner.
-- Prevents abuse of unlimited shop creation.
-- ============================================================

DROP POLICY IF EXISTS "authenticated users can create a shop" ON public.shops;

CREATE POLICY "authenticated users can create a shop"
  ON public.shops FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      SELECT COUNT(*) FROM public.shop_members
      WHERE user_id = auth.uid() AND role = 'owner'
    ) < 10
  );

COMMIT;
