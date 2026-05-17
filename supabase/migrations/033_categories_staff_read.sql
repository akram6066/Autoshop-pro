-- ============================================================
-- 033_categories_staff_read.sql
-- Categories are owner_id-scoped (per user, not per shop).
-- Staff have no categories of their own, so they see nothing.
-- This policy lets staff read the categories that belong to
-- the owner of any shop they are a member of.
-- ============================================================

CREATE POLICY "staff can read shop owner categories"
  ON public.categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.shop_members sm_viewer
      JOIN public.shop_members sm_owner
        ON sm_owner.shop_id = sm_viewer.shop_id
      WHERE sm_viewer.user_id = auth.uid()
        AND sm_owner.user_id  = categories.owner_id
        AND sm_owner.role     = 'owner'
    )
  );
