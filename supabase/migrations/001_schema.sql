BEGIN;

-- ============================================================
-- 001_schema.sql — AutoShop Pro full schema
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────────────────────────



-- ─── Enums ────────────────────────────────────────────────────────────────────

create type user_role as enum ('owner', 'staff');
create type product_category as enum ('tire', 'battery', 'rim');
create type movement_type as enum ('IN', 'OUT');
create type movement_reason as enum ('sale', 'restock', 'adjustment');
create type sync_operation as enum ('INSERT', 'UPDATE', 'DELETE');
create type sync_status as enum ('pending', 'synced', 'failed');
create type po_status as enum ('draft', 'received', 'partial');

-- ─── Tables ───────────────────────────────────────────────────────────────────

-- shops
create table public.shops (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  created_at  timestamptz not null default now()
);

-- rooms (dynamic storage rooms per shop)
create table public.rooms (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- profiles (extends auth.users)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  shop_id     uuid references public.shops(id) on delete set null,
  full_name   text not null default '',
  role        user_role not null default 'staff',
  created_at  timestamptz not null default now()
);

-- products
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops(id) on delete cascade,
  room_id     uuid not null references public.rooms(id) on delete restrict,
  name        text not null,
  sku         text not null,
  category    product_category not null,
  quantity    integer not null default 0 check (quantity >= 0),
  min_stock   integer not null default 5 check (min_stock >= 0),
  price       numeric(12, 2) not null default 0 check (price >= 0),
  updated_at  timestamptz not null default now(),
  unique (shop_id, sku)
);

-- sales
create table public.sales (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references public.shops(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete restrict,
  total_amount  numeric(12, 2) not null default 0,
  synced        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- sale_items
create table public.sale_items (
  id          uuid primary key default gen_random_uuid(),
  sale_id     uuid not null references public.sales(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete restrict,
  quantity    integer not null check (quantity > 0),
  unit_price  numeric(12, 2) not null
);

-- stock_movements (delta-based, not last-write-wins)
create table public.stock_movements (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references public.shops(id) on delete cascade,
  product_id    uuid not null references public.products(id) on delete cascade,
  type          movement_type not null,
  delta         integer not null check (delta > 0),
  snapshot_qty  integer not null,
  seq           bigint not null default extract(epoch from now()) * 1000,
  device_id     text not null,
  reason        movement_reason not null,
  user_id       uuid not null references auth.users(id) on delete restrict,
  synced        boolean not null default false,
  conflict_flag boolean not null default false,
  created_at    timestamptz not null default now()
);

-- sync_queue (offline mutations waiting to replay)
create table public.sync_queue (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops(id) on delete cascade,
  table_name  text not null,
  operation   sync_operation not null,
  payload     jsonb not null,
  status      sync_status not null default 'pending',
  error       text,
  attempts    integer not null default 0,
  created_at  timestamptz not null default now()
);

-- purchase_orders
create table public.purchase_orders (
  id              uuid primary key default gen_random_uuid(),
  shop_id         uuid not null references public.shops(id) on delete cascade,
  supplier_name   text not null,
  status          po_status not null default 'draft',
  received_by     uuid references auth.users(id),
  received_at     timestamptz,
  synced          boolean not null default false,
  created_at      timestamptz not null default now()
);

-- po_items
create table public.po_items (
  id            uuid primary key default gen_random_uuid(),
  po_id         uuid not null references public.purchase_orders(id) on delete cascade,
  product_id    uuid not null references public.products(id) on delete restrict,
  qty_expected  integer not null check (qty_expected > 0),
  qty_received  integer not null default 0,
  unit_cost     numeric(12, 2) not null default 0
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index idx_rooms_shop_id on public.rooms(shop_id);
create index idx_profiles_shop_id on public.profiles(shop_id);
create index idx_products_shop_id on public.products(shop_id);
create index idx_products_room_id on public.products(room_id);
create index idx_products_category on public.products(category);
create index idx_sales_shop_id on public.sales(shop_id);
create index idx_sales_created_at on public.sales(created_at);
create index idx_sale_items_sale_id on public.sale_items(sale_id);
create index idx_stock_movements_product_id on public.stock_movements(product_id);
create index idx_stock_movements_shop_id on public.stock_movements(shop_id);
create index idx_stock_movements_seq on public.stock_movements(seq);
create index idx_sync_queue_shop_status on public.sync_queue(shop_id, status);
create index idx_po_items_po_id on public.po_items(po_id);

-- ─── Triggers ─────────────────────────────────────────────────────────────────

-- Auto-update products.updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, ''),
    'staff'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

COMMIT;
