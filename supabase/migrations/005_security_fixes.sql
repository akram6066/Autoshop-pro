-- ============================================================
-- 005_security_fixes.sql
-- ============================================================

-- ─── 1. Harden auth_shop_id() ────────────────────────────────────────────────


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

-- ─── 2. Restrict shop_members INSERT policy ─────────────────────────────────

drop policy if exists "authenticated users can join a shop" on public.shop_members;

create policy "authenticated users can join a shop as staff"
  on public.shop_members for insert
  with check (
    user_id = auth.uid()
    and role = 'staff'
  );

-- ─── 3. Fix profiles INSERT policy ───────────────────────────────────────────


drop policy if exists "service role can insert profiles" on public.profiles;

create policy "users can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());
