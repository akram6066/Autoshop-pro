-- ============================================================
-- 012_lockdown_profile_role.sql
--
-- Critical fix: profiles.role was self-mutable by any authenticated user.
-- Combined with the "users can update own profile" RLS policy, this allowed
-- any signed-up user to escalate themselves to role='owner' from the client.
--
-- Strategy:
--   1. Trigger BEFORE UPDATE on profiles that blocks role changes unless the
--      caller is a SECURITY DEFINER function (where current_setting allows).
--   2. Revoke direct UPDATE on profiles.role from the `authenticated` role.
--   3. Provide an audit-friendly SECURITY DEFINER RPC for legitimate role
--      changes (only owners of a shop can change a member's role within
--      that shop, and never to their own profile).
-- ============================================================

-- ─── 1. Block role mutations from non-definer contexts ──────────────────────

create or replace function public.profiles_block_role_update()
returns trigger as $$
begin
  if new.role is distinct from old.role then
    -- Allow only when running as a SECURITY DEFINER function.
    -- The session_user is the role that started the session (e.g. 'authenticator').
    -- Inside SECURITY DEFINER, current_user becomes the function owner ('postgres').
    -- This check rejects direct UPDATEs from `authenticated` while allowing
    -- definer-owned RPCs (setup_owner_shop, set_member_role) to proceed.
    if current_user = 'authenticated' then
      raise exception 'role cannot be changed directly. Use set_member_role().'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_block_role_update on public.profiles;
create trigger trg_profiles_block_role_update
  before update on public.profiles
  for each row execute procedure public.profiles_block_role_update();

-- ─── 2. Revoke column-level UPDATE on role from authenticated ───────────────
-- Defense in depth: even if the trigger is dropped, the column grant blocks it.

revoke update (role) on public.profiles from authenticated;
revoke update (role) on public.profiles from anon;

-- Allow updates to the harmless columns users SHOULD be able to change.
grant update (full_name, shop_id) on public.profiles to authenticated;

-- ─── 3. set_member_role RPC ─────────────────────────────────────────────────
-- Only owners of a shop can promote/demote staff in that shop.
-- Cannot be used to change your own role (must go through setup_owner_shop).

create or replace function public.set_member_role(
  p_shop_id uuid,
  p_user_id uuid,
  p_new_role user_role
)
returns void as $$
declare
  v_caller_role user_role;
begin
  -- Caller must be an owner of this shop
  select role into v_caller_role
  from public.shop_members
  where shop_id = p_shop_id and user_id = auth.uid();

  if v_caller_role is null or v_caller_role <> 'owner' then
    raise exception 'Only shop owners can change member roles'
      using errcode = '42501';
  end if;

  -- Cannot change your own role
  if p_user_id = auth.uid() then
    raise exception 'Cannot change your own role'
      using errcode = '42501';
  end if;

  -- Update shop_members
  update public.shop_members
  set role = p_new_role
  where shop_id = p_shop_id and user_id = p_user_id;

  -- Sync profiles.role only if this shop is the user's active shop
  update public.profiles
  set role = p_new_role
  where id = p_user_id and shop_id = p_shop_id;
end;
$$ language plpgsql security definer;

revoke all on function public.set_member_role(uuid, uuid, user_role) from public;
grant execute on function public.set_member_role(uuid, uuid, user_role) to authenticated;

-- ─── 4. Backfill: ensure no orphaned 'owner' profiles exist without membership
-- A user whose profile says role='owner' but who isn't in shop_members as owner
-- is a leftover from the pre-fix vulnerability. Demote them to 'staff'.

update public.profiles p
set role = 'staff'
where p.role = 'owner'
  and not exists (
    select 1 from public.shop_members sm
    where sm.user_id = p.id
      and sm.shop_id = p.shop_id
      and sm.role = 'owner'
  );
