BEGIN;

-- ============================================================
-- 020_invite_system.sql
-- Implements a secure, invite-based staff onboarding flow.
-- Prevents "membership hijacking" and ensures user consent.
-- ============================================================

-- ─── 1. Enums & Tables ───────────────────────────────────────────────────────

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_status') THEN
    CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.shop_invites (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     uuid          NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  inviter_id  uuid          NOT NULL REFERENCES auth.users(id),
  email       text          NOT NULL,
  role        user_role     NOT NULL DEFAULT 'staff',
  status      invite_status NOT NULL DEFAULT 'pending',
  created_at  timestamptz   NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (shop_id, email, status) -- Prevent multiple pending invites to same person for same shop
);

-- Indexing for lookup speed
CREATE INDEX idx_shop_invites_email ON public.shop_invites(email);
CREATE INDEX idx_shop_invites_shop_id ON public.shop_invites(shop_id);

-- Enable RLS
ALTER TABLE public.shop_invites ENABLE ROW LEVEL SECURITY;

-- ─── 2. RLS Policies ─────────────────────────────────────────────────────────

-- Users can view invites sent to their email
CREATE POLICY "users can view own invites"
  ON public.shop_invites FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Owners can view invites they sent or for their shop
CREATE POLICY "owners can view shop invites"
  ON public.shop_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = public.shop_invites.shop_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- ─── 3. Invite Management RPCs ───────────────────────────────────────────────

-- Create a new invite
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
  -- A) Validate Inviter (Must be Owner)
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid() AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only shop owners can invite staff' USING ERRCODE = '42501';
  END IF;

  -- B) Check Shop Limits (Redundant but safe)
  SELECT plan INTO v_plan FROM public.shops WHERE id = p_shop_id;
  SELECT COUNT(*) INTO v_count FROM public.shop_members WHERE shop_id = p_shop_id AND role = 'staff';
  
  IF v_plan = 'free' AND v_count >= 3 THEN
    RAISE EXCEPTION 'Staff limit reached for free plan' USING ERRCODE = 'P0001';
  END IF;

  -- C) Cleanup old pending invites for this email/shop
  UPDATE public.shop_invites
  SET status = 'expired'
  WHERE shop_id = p_shop_id 
    AND email = lower(trim(p_email))
    AND status = 'pending';

  -- D) Insert Invite
  INSERT INTO public.shop_invites (shop_id, inviter_id, email, role)
  VALUES (p_shop_id, auth.uid(), lower(trim(p_email)), p_role)
  RETURNING id INTO v_invite_id;

  RETURN v_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Accept an invite
CREATE OR REPLACE FUNCTION public.accept_shop_invite(p_invite_id uuid)
RETURNS void AS $$
DECLARE
  v_invite RECORD;
BEGIN
  -- A) Fetch and Lock Invite
  SELECT * INTO v_invite
  FROM public.shop_invites
  WHERE id = p_invite_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or no longer pending';
  END IF;

  -- B) Verify Identity
  IF v_invite.email != (SELECT email FROM auth.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'This invite was sent to a different email address' USING ERRCODE = '42501';
  END IF;

  -- C) Create Membership (Atomic Transaction)
  INSERT INTO public.shop_members (shop_id, user_id, role)
  VALUES (v_invite.shop_id, auth.uid(), v_invite.role)
  ON CONFLICT (shop_id, user_id) DO UPDATE
  SET role = EXCLUDED.role;

  -- D) Mark Invite as Accepted
  UPDATE public.shop_invites
  SET status = 'accepted', accepted_at = now()
  WHERE id = p_invite_id;

  -- E) Sync Active Shop for the user
  UPDATE public.profiles
  SET shop_id = v_invite.shop_id,
      role = v_invite.role
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Reject an invite
CREATE OR REPLACE FUNCTION public.reject_shop_invite(p_invite_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.shop_invites
  SET status = 'rejected'
  WHERE id = p_invite_id
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 4. Revoke Old Unsafe Logic ─────────────────────────────────────────────

-- Drop the old add_staff_member function as it's unsafe (forced membership)
DROP FUNCTION IF EXISTS public.add_staff_member(uuid, text);

-- Ensure authenticated users can execute the new RPCs
GRANT EXECUTE ON FUNCTION public.create_shop_invite(uuid, text, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_shop_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_shop_invite(uuid) TO authenticated;

COMMIT;
