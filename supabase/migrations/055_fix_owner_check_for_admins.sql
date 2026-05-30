-- Fix: admins can reset their password even when they have no active shop.
-- Previously check_is_owner_by_email only checked shop_members + profiles.role,
-- so admins who deleted their only shop were blocked from the reset flow.

CREATE OR REPLACE FUNCTION public.check_is_owner_by_email(p_email text)
RETURNS boolean AS $$
DECLARE
  v_user_id  uuid;
  v_is_admin boolean;
  v_is_owner boolean;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

  -- Unknown email: return true so Supabase handles it silently (no enumeration leak).
  IF v_user_id IS NULL THEN
    RETURN true;
  END IF;

  -- Admins can always reset their own password.
  SELECT COALESCE(is_admin, false) INTO v_is_admin
  FROM public.profiles WHERE id = v_user_id;

  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Check shop_members for an owner role.
  SELECT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE user_id = v_user_id AND role = 'owner'
  ) INTO v_is_owner;

  -- Fallback: check profiles.role (covers edge case where membership was deleted).
  IF NOT v_is_owner THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = v_user_id AND role = 'owner'
    ) INTO v_is_owner;
  END IF;

  RETURN v_is_owner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
