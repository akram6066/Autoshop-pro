-- ============================================================
-- 056_create_additional_shop.sql
-- RPC to create a second+ shop for an existing authenticated user.
-- Direct INSERT on shops/shop_members was revoked in migration 019,
-- so a security-definer function is required.
-- ============================================================

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

  -- Look up the caller's plan max_shops limit
  SELECT sp.max_shops INTO v_max_shops
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON sp.id = s.plan_id
  WHERE s.user_id = v_user_id
  LIMIT 1;

  v_max_shops := COALESCE(v_max_shops, 1);

  -- Count shops the caller already owns
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

  RETURN to_json(v_shop);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_additional_shop(text, text) TO authenticated;
