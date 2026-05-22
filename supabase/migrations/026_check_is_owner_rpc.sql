BEGIN;

-- ============================================================
-- 026_check_is_owner_rpc.sql
-- Function to allow checking if an email belongs to an owner
-- for the forgot password flow.
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_is_owner_by_email(p_email text)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
  v_is_owner boolean;
BEGIN
  -- Find user_id from auth.users (requires security definer)
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    -- If user does not exist, we return true to not leak existence.
    -- Supabase auth will just silently handle the non-existent email reset.
    RETURN true;
  END IF;

  -- Check if they are owner in any shop_members
  SELECT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE user_id = v_user_id AND role = 'owner'
  ) INTO v_is_owner;

  -- Fallback to profiles just in case
  IF NOT v_is_owner THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = v_user_id AND role = 'owner'
    ) INTO v_is_owner;
  END IF;

  RETURN v_is_owner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
