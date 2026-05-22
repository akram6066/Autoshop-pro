BEGIN;

-- ============================================================
-- 002_rls.sql — Row Level Security policies
-- ============================================================

-- ─── Helper Functions ─────────────────────────────────────────────────────────

-- Returns the shop_id for the current authenticated user
create or replace function public.auth_shop_id()
returns uuid as $$
  select shop_id from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- Returns the role for the current authenticated user
create or replace function public.auth_role()
returns user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- ─── Enable RLS ───────────────────────────────────────────────────────────────

alter table public.shops            enable row level security;
alter table public.rooms            enable row level security;
alter table public.profiles         enable row level security;
alter table public.products         enable row level security;
alter table public.sales            enable row level security;
alter table public.sale_items       enable row level security;
alter table public.stock_movements  enable row level security;
alter table public.sync_queue       enable row level security;
alter table public.purchase_orders  enable row level security;
alter table public.po_items         enable row level security;

-- ─── shops ────────────────────────────────────────────────────────────────────

create policy "shop members can view their shop"
  on public.shops for select
  using (id = public.auth_shop_id());

create policy "owners can update their shop"
  on public.shops for update
  using (id = public.auth_shop_id() and public.auth_role() = 'owner');

create policy "authenticated users can create a shop"
  on public.shops for insert
  with check (auth.uid() is not null);

-- ─── rooms ────────────────────────────────────────────────────────────────────

create policy "shop members can view rooms"
  on public.rooms for select
  using (shop_id = public.auth_shop_id());

create policy "owners can manage rooms"
  on public.rooms for insert
  with check (shop_id = public.auth_shop_id() and public.auth_role() = 'owner');

create policy "owners can update rooms"
  on public.rooms for update
  using (shop_id = public.auth_shop_id() and public.auth_role() = 'owner');

create policy "owners can delete rooms"
  on public.rooms for delete
  using (shop_id = public.auth_shop_id() and public.auth_role() = 'owner');

-- ─── profiles ─────────────────────────────────────────────────────────────────

create policy "users can view own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "owners can view shop profiles"
  on public.profiles for select
  using (shop_id = public.auth_shop_id() and public.auth_role() = 'owner');

create policy "users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

create policy "service role can insert profiles"
  on public.profiles for insert
  with check (true);

-- ─── products ─────────────────────────────────────────────────────────────────

create policy "shop members can view products"
  on public.products for select
  using (shop_id = public.auth_shop_id());

create policy "shop members can insert products"
  on public.products for insert
  with check (shop_id = public.auth_shop_id());

create policy "shop members can update products"
  on public.products for update
  using (shop_id = public.auth_shop_id());

create policy "owners can delete products"
  on public.products for delete
  using (shop_id = public.auth_shop_id() and public.auth_role() = 'owner');

-- ─── sales ────────────────────────────────────────────────────────────────────

create policy "shop members can view sales"
  on public.sales for select
  using (shop_id = public.auth_shop_id());

create policy "shop members can insert sales"
  on public.sales for insert
  with check (shop_id = public.auth_shop_id());

-- ─── sale_items ───────────────────────────────────────────────────────────────

create policy "shop members can view sale items"
  on public.sale_items for select
  using (
    sale_id in (
      select id from public.sales where shop_id = public.auth_shop_id()
    )
  );

create policy "shop members can insert sale items"
  on public.sale_items for insert
  with check (
    sale_id in (
      select id from public.sales where shop_id = public.auth_shop_id()
    )
  );

-- ─── stock_movements ──────────────────────────────────────────────────────────

create policy "shop members can view movements"
  on public.stock_movements for select
  using (shop_id = public.auth_shop_id());

create policy "shop members can insert movements"
  on public.stock_movements for insert
  with check (shop_id = public.auth_shop_id());

-- ─── sync_queue ───────────────────────────────────────────────────────────────

create policy "shop members can manage sync queue"
  on public.sync_queue for all
  using (shop_id = public.auth_shop_id())
  with check (shop_id = public.auth_shop_id());

-- ─── purchase_orders ──────────────────────────────────────────────────────────

create policy "shop members can view purchase orders"
  on public.purchase_orders for select
  using (shop_id = public.auth_shop_id());

create policy "owners can manage purchase orders"
  on public.purchase_orders for insert
  with check (shop_id = public.auth_shop_id() and public.auth_role() = 'owner');

create policy "owners can update purchase orders"
  on public.purchase_orders for update
  using (shop_id = public.auth_shop_id() and public.auth_role() = 'owner');

-- ─── po_items ─────────────────────────────────────────────────────────────────

create policy "shop members can view po items"
  on public.po_items for select
  using (
    po_id in (
      select id from public.purchase_orders where shop_id = public.auth_shop_id()
    )
  );

create policy "owners can manage po items"
  on public.po_items for insert
  with check (
    po_id in (
      select id from public.purchase_orders where shop_id = public.auth_shop_id()
    )
  );

COMMIT;
