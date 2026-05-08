-- ============================================================
-- 004_categories_multishop.sql
-- B) Flexible categories per shop
-- C) Multi-shop support via shop_members table
-- ============================================================

-- ─── B) Categories table ──────────────────────────────────────────────────────

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops(id) on delete cascade,
  name        text not null,
  color       text not null default '#6194f8',
  created_at  timestamptz not null default now(),
  unique (shop_id, name)
);

create index idx_categories_shop_id on public.categories(shop_id);

-- Change products.category from enum to text FK
alter table public.products
  alter column category type text using category::text;

-- Drop the old enum (after migrating)
-- NOTE: We keep the old enum type for now to avoid breaking anything
-- products.category is now a free text field referencing categories.name

-- ─── C) shop_members table ────────────────────────────────────────────────────
-- Replaces the single shop_id on profiles
-- One user can now be a member of multiple shops with different roles

create table public.shop_members (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        user_role not null default 'staff',
  created_at  timestamptz not null default now(),
  unique (shop_id, user_id)
);

create index idx_shop_members_user_id on public.shop_members(user_id);
create index idx_shop_members_shop_id on public.shop_members(shop_id);

-- ─── RLS: categories ──────────────────────────────────────────────────────────

alter table public.categories enable row level security;

create policy "shop members can view categories"
  on public.categories for select
  using (
    shop_id in (
      select shop_id from public.shop_members where user_id = auth.uid()
    )
  );

create policy "owners can manage categories"
  on public.categories for insert
  with check (
    shop_id in (
      select shop_id from public.shop_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

create policy "owners can update categories"
  on public.categories for update
  using (
    shop_id in (
      select shop_id from public.shop_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

create policy "owners can delete categories"
  on public.categories for delete
  using (
    shop_id in (
      select shop_id from public.shop_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- ─── RLS: shop_members ────────────────────────────────────────────────────────

alter table public.shop_members enable row level security;

create policy "members can view their own memberships"
  on public.shop_members for select
  using (user_id = auth.uid());

create policy "owners can view all members of their shop"
  on public.shop_members for select
  using (
    shop_id in (
      select shop_id from public.shop_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

create policy "authenticated users can join a shop"
  on public.shop_members for insert
  with check (auth.uid() is not null);

create policy "owners can remove members"
  on public.shop_members for delete
  using (
    shop_id in (
      select shop_id from public.shop_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- ─── Helper functions (updated for multi-shop) ────────────────────────────────

-- Returns all shop_ids the current user belongs to
create or replace function public.auth_shop_ids()
returns uuid[] as $$
  select array_agg(shop_id) from public.shop_members where user_id = auth.uid();
$$ language sql stable security definer;

-- Returns the role of the current user in a specific shop
create or replace function public.auth_role_in_shop(p_shop_id uuid)
returns user_role as $$
  select role from public.shop_members
  where user_id = auth.uid() and shop_id = p_shop_id;
$$ language sql stable security definer;

-- ─── setup_owner_shop: updated to use shop_members ───────────────────────────

create or replace function public.setup_owner_shop(
  p_user_id uuid,
  p_shop_name text,
  p_shop_address text,
  p_full_name text
)
returns uuid as $$
declare
  v_shop_id uuid;
begin
  -- Update profile name
  update public.profiles
  set full_name = p_full_name
  where id = p_user_id;

  -- Create the shop
  insert into public.shops (name, address)
  values (p_shop_name, p_shop_address)
  returning id into v_shop_id;

  -- Add owner to shop_members
  insert into public.shop_members (shop_id, user_id, role)
  values (v_shop_id, p_user_id, 'owner');

  -- Also keep profile.shop_id in sync (last active shop)
  update public.profiles
  set shop_id = v_shop_id, role = 'owner'
  where id = p_user_id;

  return v_shop_id;
end;
$$ language plpgsql security definer;

-- ─── Seed default categories when a shop is created ──────────────────────────

create or replace function public.seed_default_categories(p_shop_id uuid)
returns void as $$
begin
  insert into public.categories (shop_id, name, color) values
    (p_shop_id, 'Tire', '#3b6ef5'),
    (p_shop_id, 'Battery', '#d97706'),
    (p_shop_id, 'Rim', '#16a34a')
  on conflict (shop_id, name) do nothing;
end;
$$ language plpgsql security definer;

-- ─── get_low_stock_products: updated ─────────────────────────────────────────
-- Drop first because the return type changes (adds category column)
drop function if exists public.get_low_stock_products(uuid);

create or replace function public.get_low_stock_products(p_shop_id uuid)
returns table (
  id uuid,
  name text,
  sku text,
  quantity integer,
  min_stock integer,
  room_id uuid,
  category text
) as $$
begin
  return query
  select p.id, p.name, p.sku, p.quantity, p.min_stock, p.room_id, p.category
  from public.products p
  where p.shop_id = p_shop_id
    and p.quantity <= p.min_stock
  order by p.quantity asc, p.name asc;
end;
$$ language plpgsql stable security definer;
