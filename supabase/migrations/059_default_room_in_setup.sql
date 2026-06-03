-- ============================================================
-- 059_default_room_in_setup.sql
--
-- Adds a default "Main Store" room when a new shop is created
-- via setup_owner_shop so the shop is immediately usable for
-- recording sales without requiring the owner to add a room first.
-- ============================================================

CREATE OR REPLACE FUNCTION public.setup_owner_shop(
  p_user_id    uuid,
  p_shop_name  text,
  p_shop_address text,
  p_full_name  text
)
RETURNS uuid AS $$
DECLARE
  v_shop_id uuid;
BEGIN
  -- A) Prevent setting up a shop for another user
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot setup shop for another user' USING ERRCODE = '42501';
  END IF;

  -- B) Update profile name
  UPDATE public.profiles
  SET full_name = p_full_name
  WHERE id = p_user_id;

  -- C) Create the shop
  INSERT INTO public.shops (name, address)
  VALUES (p_shop_name, p_shop_address)
  RETURNING id INTO v_shop_id;

  -- D) Add owner to shop_members
  INSERT INTO public.shop_members (shop_id, user_id, role)
  VALUES (v_shop_id, p_user_id, 'owner');

  -- E) Sync profile active shop and role
  UPDATE public.profiles
  SET shop_id = v_shop_id, role = 'owner'
  WHERE id = p_user_id;

  -- F) Create default room so the shop works immediately
  INSERT INTO public.rooms (shop_id, name)
  VALUES (v_shop_id, 'Main Store');

  RETURN v_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
