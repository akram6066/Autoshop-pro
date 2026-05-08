-- ============================================================
-- 005_security_fixes.sql
-- ============================================================

-- ─── 1. Harden auth_shop_id() ────────────────────────────────────────────────
-- Old version read profiles.shop_id with no membership check.
-- A user could UPDATE their own profiles.shop_id to any UUID and bypass RLS
-- on every data table. Now we also verify the user is actually in shop_members
-- for that shop, so a forged shop_id produces NULL and all policies deny access.

create or replace function public.auth_shop_id()
returns uuid as $$
  select p.shop_id
  from public.profiles p
  where p.id = auth.uid()
    and exists (
      select 1 from public.shop_members sm
      where sm.user_id = auth.uid()
        and sm.shop_id = p.shop_id
    );
$$ language sql stable security definer;

-- ─── 2. Fix shop_members INSERT policy ───────────────────────────────────────
-- Old policy: with check (auth.uid() is not null)
-- Any authenticated user could insert themselves into ANY shop with role='owner',
-- granting full owner access to another shop (privilege escalation).
-- New policy: users can only insert their own user_id, and only as 'staff'.
-- Owners are inserted exclusively by SECURITY DEFINER functions (setup_owner_shop).

drop policy if exists "authenticated users can join a shop" on public.shop_members;

create policy "authenticated users can join a shop as staff"
  on public.shop_members for insert
  with check (
    user_id = auth.uid()
    and role = 'staff'
  );

-- ─── 3. Fix profiles INSERT policy ───────────────────────────────────────────
-- Old policy: with check (true) — any request could insert any profile row.
-- The handle_new_user trigger (SECURITY DEFINER) handles all legitimate inserts
-- and bypasses RLS, so authenticated users never need to INSERT profiles directly.
-- Restrict to own profile only as a safety net.

drop policy if exists "service role can insert profiles" on public.profiles;

create policy "users can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());
