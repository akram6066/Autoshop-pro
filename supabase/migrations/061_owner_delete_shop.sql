BEGIN;

-- ============================================================
-- 061_owner_delete_shop.sql
--
-- Adds a SECURITY DEFINER RPC that lets an owner safely delete
-- one of their shops without breaking their account or any other
-- shop they belong to.
--
-- What it does atomically:
--   1. Validates caller is authenticated and is the shop owner.
--   2. For every member whose profiles.shop_id points at the
--      deleted shop, switches them to their next available shop
--      (or NULL if they have no other shop).
--   3. Removes all shop_members rows for the deleted shop so the
--      shop no longer appears in any member's shop list.
--   4. Soft-deletes the shop (sets deleted_at) so admins can
--      restore it if the deletion was accidental.
--
-- The shop's data (products, sales, stock_movements, etc.) is
-- preserved until an admin permanently deletes from the trash.
-- ============================================================

CREATE OR REPLACE FUNCTION public.owner_delete_shop(p_shop_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller     uuid := auth.uid();
  v_member     record;
  v_next_shop  uuid;
BEGIN
  -- ── 1. Auth ────────────────────────────────────────────────────────────────
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  -- ── 2. Ownership check ─────────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id
      AND user_id = v_caller
      AND role    = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only the shop owner can delete this shop'
      USING ERRCODE = '42501';
  END IF;

  -- ── 3. Reroute each member's active shop pointer ───────────────────────────
  -- If a member's profiles.shop_id is the one being deleted, update it to
  -- any other non-deleted shop they belong to (NULL if they have none).
  FOR v_member IN
    SELECT user_id FROM public.shop_members WHERE shop_id = p_shop_id
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = v_member.user_id AND shop_id = p_shop_id
    ) THEN
      SELECT sm.shop_id INTO v_next_shop
      FROM   public.shop_members sm
      JOIN   public.shops        s  ON s.id = sm.shop_id
      WHERE  sm.user_id  = v_member.user_id
        AND  sm.shop_id != p_shop_id
        AND  s.deleted_at IS NULL
      LIMIT 1;

      UPDATE public.profiles
      SET    shop_id = v_next_shop   -- NULL when no other shop exists
      WHERE  id      = v_member.user_id;
    END IF;
  END LOOP;

  -- ── 4. Remove all memberships for this shop ────────────────────────────────
  -- Members no longer have access; the shop disappears from their shop list.
  DELETE FROM public.shop_members WHERE shop_id = p_shop_id;

  -- ── 5. Soft-delete the shop ────────────────────────────────────────────────
  UPDATE public.shops
  SET    deleted_at = now(),
         deleted_by = v_caller
  WHERE  id = p_shop_id;

END;
$$;

-- Only authenticated users can call this; the body enforces ownership.
GRANT EXECUTE ON FUNCTION public.owner_delete_shop(uuid) TO authenticated;

COMMIT;
