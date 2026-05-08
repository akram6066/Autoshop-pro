-- ============================================================
-- 003_functions.sql — AutoShop Pro database functions
-- ============================================================

-- ─── apply_stock_deltas ───────────────────────────────────────────────────────
-- Sums unsynced stock movements for a product and applies atomically

create or replace function public.apply_stock_deltas(p_product_id uuid)
returns void as $$
declare
  v_net_delta integer;
begin
  select
    sum(case when type = 'IN' then delta else -delta end)
  into v_net_delta
  from public.stock_movements
  where product_id = p_product_id
    and synced = false;

  if v_net_delta is not null and v_net_delta != 0 then
    update public.products
    set
      quantity = greatest(0, quantity + v_net_delta),
      updated_at = now()
    where id = p_product_id;

    -- Mark movements as synced
    update public.stock_movements
    set synced = true
    where product_id = p_product_id
      and synced = false;
  end if;
end;
$$ language plpgsql security definer;

-- ─── record_sale ──────────────────────────────────────────────────────────────
-- Inserts a sale + items + stock movements atomically

create or replace function public.record_sale(
  p_sale jsonb,
  p_items jsonb
)
returns uuid as $$
declare
  v_sale_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_unit_price numeric;
  v_current_qty integer;
begin
  -- Insert sale
  v_sale_id := (p_sale->>'id')::uuid;

  insert into public.sales (id, shop_id, user_id, total_amount, synced, created_at)
  values (
    v_sale_id,
    (p_sale->>'shop_id')::uuid,
    (p_sale->>'user_id')::uuid,
    (p_sale->>'total_amount')::numeric,
    true,
    coalesce((p_sale->>'created_at')::timestamptz, now())
  );

  -- Insert items + deduct stock
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;

    -- Get current quantity
    select quantity into v_current_qty
    from public.products
    where id = v_product_id
    for update;

    if v_current_qty < v_qty then
      raise exception 'Insufficient stock for product %', v_product_id;
    end if;

    -- Insert sale item
    insert into public.sale_items (id, sale_id, product_id, quantity, unit_price)
    values (
      coalesce((v_item->>'id')::uuid, gen_random_uuid()),
      v_sale_id,
      v_product_id,
      v_qty,
      v_unit_price
    );

    -- Deduct stock
    update public.products
    set
      quantity = quantity - v_qty,
      updated_at = now()
    where id = v_product_id;

    -- Record movement
    insert into public.stock_movements (
      shop_id, product_id, type, delta, snapshot_qty,
      device_id, reason, user_id, synced
    )
    values (
      (p_sale->>'shop_id')::uuid,
      v_product_id,
      'OUT',
      v_qty,
      v_current_qty - v_qty,
      coalesce(p_sale->>'device_id', 'server'),
      'sale',
      (p_sale->>'user_id')::uuid,
      true
    );
  end loop;

  return v_sale_id;
end;
$$ language plpgsql security definer;

-- ─── get_low_stock_products ───────────────────────────────────────────────────

create or replace function public.get_low_stock_products(p_shop_id uuid)
returns table (
  id uuid,
  name text,
  sku text,
  quantity integer,
  min_stock integer,
  room_id uuid
) as $$
begin
  return query
  select
    p.id,
    p.name,
    p.sku,
    p.quantity,
    p.min_stock,
    p.room_id
  from public.products p
  where p.shop_id = p_shop_id
    and p.quantity <= p.min_stock
  order by p.quantity asc, p.name asc;
end;
$$ language plpgsql stable security definer;

-- ─── get_sales_summary ────────────────────────────────────────────────────────

create or replace function public.get_sales_summary(
  p_shop_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  date date,
  total_revenue numeric,
  order_count bigint
) as $$
begin
  return query
  select
    s.created_at::date as date,
    coalesce(sum(s.total_amount), 0) as total_revenue,
    count(*) as order_count
  from public.sales s
  where s.shop_id = p_shop_id
    and s.created_at >= p_from
    and s.created_at <= p_to
  group by s.created_at::date
  order by date asc;
end;
$$ language plpgsql stable security definer;
