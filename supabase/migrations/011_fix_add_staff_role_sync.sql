BEGIN;

-- ============================================================
-- 011_fix_add_staff_role_sync.sql
-- Keep profiles.role in sync when adding staff.
-- ============================================================

CREATE OR REPLACE FUNCTION public.add_staff_member(
  p_shop_id uuid,
  p_email text
)
RETURNS text AS $$
DECLARE
  v_target_id uuid;
  v_existing text;
  v_active_shop uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid() AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Not authorized — you must be an owner of this shop';
  END IF;

  SELECT id INTO v_target_id
  FROM auth.users
  WHERE email = lower(trim(p_email))
  LIMIT 1;

  IF v_target_id IS NULL THEN
    RETURN 'user_not_found';
  END IF;

  SELECT role INTO v_existing
  FROM public.shop_members
  WHERE shop_id = p_shop_id AND user_id = v_target_id;

  IF v_existing IS NOT NULL THEN
    RETURN 'already_member';
  END IF;

  INSERT INTO public.shop_members (shop_id, user_id, role)
  VALUES (p_shop_id, v_target_id, 'staff');

  -- Sync profiles: if user has no active shop, give them this one
  SELECT shop_id INTO v_active_shop
  FROM public.profiles WHERE id = v_target_id;

  IF v_active_shop IS NULL THEN
    UPDATE public.profiles
    SET shop_id = p_shop_id, role = 'staff'
    WHERE id = v_target_id;
  END IF;

  RETURN 'added';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
