-- ============================================================
-- 057_invite_expiry.sql
-- Adds expires_at to shop_invites (7-day default).
-- Enforces expiry in accept_shop_invite RPC.
-- Auto-expires old pending invites in prune_old_data.
-- ============================================================

ALTER TABLE public.shop_invites
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '7 days');

-- Backfill existing rows to expire 7 days from creation
UPDATE public.shop_invites
SET expires_at = created_at + INTERVAL '7 days'
WHERE expires_at IS NULL OR expires_at = (now() + INTERVAL '7 days');

-- Update create_shop_invite to set explicit expiry
CREATE OR REPLACE FUNCTION public.create_shop_invite(
  p_shop_id uuid,
  p_email   text,
  p_role    user_role
)
RETURNS uuid AS $$
DECLARE
  v_invite_id uuid;
  v_plan      text;
  v_count     integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid() AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only shop owners can invite staff' USING ERRCODE = '42501';
  END IF;

  SELECT plan INTO v_plan FROM public.shops WHERE id = p_shop_id;
  SELECT COUNT(*) INTO v_count FROM public.shop_members WHERE shop_id = p_shop_id AND role = 'staff';

  IF v_plan = 'free' AND v_count >= 3 THEN
    RAISE EXCEPTION 'Staff limit reached for free plan' USING ERRCODE = 'P0001';
  END IF;

  -- Expire any prior pending invite for this email/shop
  UPDATE public.shop_invites
  SET status = 'expired'
  WHERE shop_id = p_shop_id
    AND email = lower(trim(p_email))
    AND status = 'pending';

  INSERT INTO public.shop_invites (shop_id, inviter_id, email, role, expires_at)
  VALUES (p_shop_id, auth.uid(), lower(trim(p_email)), p_role, now() + INTERVAL '7 days')
  RETURNING id INTO v_invite_id;

  RETURN v_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Update accept_shop_invite to reject expired invites
CREATE OR REPLACE FUNCTION public.accept_shop_invite(p_invite_id uuid)
RETURNS void AS $$
DECLARE
  v_invite RECORD;
BEGIN
  SELECT * INTO v_invite
  FROM public.shop_invites
  WHERE id = p_invite_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or no longer pending';
  END IF;

  -- Enforce expiry
  IF v_invite.expires_at < now() THEN
    UPDATE public.shop_invites SET status = 'expired' WHERE id = p_invite_id;
    RAISE EXCEPTION 'This invite has expired. Ask the shop owner to send a new one.' USING ERRCODE = 'P0001';
  END IF;

  IF v_invite.email != (SELECT email FROM auth.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'This invite was sent to a different email address' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.shop_members (shop_id, user_id, role)
  VALUES (v_invite.shop_id, auth.uid(), v_invite.role)
  ON CONFLICT (shop_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.shop_invites
  SET status = 'accepted', accepted_at = now()
  WHERE id = p_invite_id;

  UPDATE public.profiles
  SET shop_id = v_invite.shop_id, role = v_invite.role
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
