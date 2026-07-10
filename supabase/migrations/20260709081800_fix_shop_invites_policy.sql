BEGIN;

-- Drop the old policy
DROP POLICY IF EXISTS "users can view own invites" ON public.shop_invites;

-- Create the new policy using auth.jwt() ->> 'email'
CREATE POLICY "users can view own invites"
  ON public.shop_invites FOR SELECT
  USING (email = (auth.jwt() ->> 'email'));

COMMIT;
