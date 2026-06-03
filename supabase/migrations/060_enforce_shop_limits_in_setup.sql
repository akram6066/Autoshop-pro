-- ============================================================
-- 060_enforce_shop_limits_in_setup.sql
--
-- 1. setup_owner_shop: add plan-limit check so free users cannot
--    create a second shop by re-running the setup flow.
-- 2. create_additional_shop: insert a default "Main Store" room
--    so every shop (not just the first) is immediately usable.
-- ============================================================

-- ── 1. setup_owner_shop (first-time setup) ────────────────────
CREATE OR REPLACE FUNCTION public.setup_owner_shop(
  p_user_id      uuid,
  p_shop_name    text,
  p_shop_address text,
  p_full_name    text
)
RETURNS uuid AS $$
DECLARE
  v_shop_id   uuid;
  v_max_shops integer;
  v_owned     integer;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot setup shop for another user' USING ERRCODE = '42501';
  END IF;

  -- Enforce plan shop limit (defaults to 1 if no subscription row yet)
  SELECT sp.max_shops INTO v_max_shops
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON sp.id = s.plan_id
  WHERE s.user_id = auth.uid()
  LIMIT 1;

  v_max_shops := COALESCE(v_max_shops, 1);

  SELECT COUNT(*) INTO v_owned
  FROM public.shop_members
  WHERE user_id = auth.uid() AND role = 'owner';

  IF v_owned >= v_max_shops THEN
    RAISE EXCEPTION 'shop_limit_reached' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.profiles SET full_name = p_full_name WHERE id = p_user_id;

  INSERT INTO public.shops (name, address)
  VALUES (p_shop_name, p_shop_address)
  RETURNING id INTO v_shop_id;

  INSERT INTO public.shop_members (shop_id, user_id, role)
  VALUES (v_shop_id, p_user_id, 'owner');

  UPDATE public.profiles
  SET shop_id = v_shop_id, role = 'owner'
  WHERE id = p_user_id;

  INSERT INTO public.rooms (shop_id, name)
  VALUES (v_shop_id, 'Main Store');

  RETURN v_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 2. create_additional_shop (second+ shop) ──────────────────
CREATE OR REPLACE FUNCTION public.create_additional_shop(
  p_name    text,
  p_address text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_user_id   uuid;
  v_max_shops integer;
  v_owned     integer;
  v_shop      public.shops%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  p_name := trim(p_name);
  IF p_name = '' THEN
    RAISE EXCEPTION 'Shop name cannot be empty' USING ERRCODE = '22023';
  END IF;

  SELECT sp.max_shops INTO v_max_shops
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON sp.id = s.plan_id
  WHERE s.user_id = v_user_id
  LIMIT 1;

  v_max_shops := COALESCE(v_max_shops, 1);

  SELECT COUNT(*) INTO v_owned
  FROM public.shop_members
  WHERE user_id = v_user_id AND role = 'owner';

  IF v_owned >= v_max_shops THEN
    RAISE EXCEPTION 'shop_limit_reached' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.shops (name, address)
  VALUES (p_name, NULLIF(trim(COALESCE(p_address, '')), ''))
  RETURNING * INTO v_shop;

  INSERT INTO public.shop_members (shop_id, user_id, role)
  VALUES (v_shop.id, v_user_id, 'owner');

  -- Default room so the shop is immediately usable
  INSERT INTO public.rooms (shop_id, name)
  VALUES (v_shop.id, 'Main Store');

  RETURN to_json(v_shop);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_additional_shop(text, text) TO authenticated;
