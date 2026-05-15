-- ============================================================
-- 027_db_audit_fix.sql
-- Full schema audit: 7 redundant indexes dropped, 3 added,
-- 3 missing columns added, 2 FK cascades fixed,
-- 16 RLS policies rewritten (IN → EXISTS).
-- CONCURRENTLY statements must run outside a transaction.
-- ============================================================

-- ── 1. Drop redundant indexes ──────────────────────────────────────────────────

-- Standalone created_at on sales; every query also filters shop_id — covered by idx_sales_shop_id_created_at
DROP INDEX CONCURRENTLY IF EXISTS idx_sales_created_at;

-- Standalone shop_id on sales; covered by idx_sales_shop_id_created_at (shop_id prefix)
DROP INDEX CONCURRENTLY IF EXISTS idx_sales_shop_id;

-- Exact duplicate of idx_sales_shop_id_created_at (both are shop_id + created_at btree)
DROP INDEX CONCURRENTLY IF EXISTS idx_sales_shop_date;

-- Exact duplicate of idx_movements_product_id added in migration 021
DROP INDEX CONCURRENTLY IF EXISTS idx_stock_movements_product_id;

-- Single-column user_id on shop_members; covered by idx_shop_members_user_id_shop_id (user_id is prefix)
DROP INDEX CONCURRENTLY IF EXISTS idx_shop_members_user_id;

-- Low-selectivity text on a write-heavy table (every sale + product change inserts here); never queried standalone
DROP INDEX CONCURRENTLY IF EXISTS idx_audit_logs_event_type;

-- Server never filters products by category alone — all filtering is client-side (useMemo)
DROP INDEX CONCURRENTLY IF EXISTS idx_products_category;

-- ── 2. Add missing RLS / FK indexes ───────────────────────────────────────────

-- RLS EXISTS check on customer_payments filters by shop_id; no index existed
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_payments_shop_id
  ON public.customer_payments (shop_id);

-- purchase_orders had zero non-PK indexes; RLS checks shop_id on every query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_orders_shop_id
  ON public.purchase_orders (shop_id);

-- po_items.product_id is a FK with no supporting index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_po_items_product_id
  ON public.po_items (product_id);

-- ── 3. Schema fixes + RLS rewrites ────────────────────────────────────────────
BEGIN;

-- Add missing columns to customers.
-- manage_customer (019) inserts/updates email, address, updated_at but they were never created.
-- Every customer CREATE and UPDATE call fails at runtime without this fix.
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS email      text,
  ADD COLUMN IF NOT EXISTS address    text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Fix customer_payments.user_id: default ON DELETE is RESTRICT, which blocks
-- deleting staff accounts from Supabase auth. Allow NULL and cascade SET NULL.
ALTER TABLE public.customer_payments
  ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.customer_payments
  DROP CONSTRAINT IF EXISTS customer_payments_user_id_fkey;
ALTER TABLE public.customer_payments
  ADD CONSTRAINT customer_payments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix shop_invites.inviter_id: same RESTRICT problem when an owner account is deleted.
ALTER TABLE public.shop_invites
  ALTER COLUMN inviter_id DROP NOT NULL;
ALTER TABLE public.shop_invites
  DROP CONSTRAINT IF EXISTS shop_invites_inviter_id_fkey;
ALTER TABLE public.shop_invites
  ADD CONSTRAINT shop_invites_inviter_id_fkey
    FOREIGN KEY (inviter_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── shops SELECT (IN → EXISTS) ────────────────────────────────────────────────
DROP POLICY IF EXISTS "shop members can view their shop" ON public.shops;
CREATE POLICY "shop members can view their shop"
  ON public.shops FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = shops.id AND user_id = auth.uid()
  ));

-- ── rooms: all four policies (IN → EXISTS) ────────────────────────────────────
DROP POLICY IF EXISTS "shop members can view rooms" ON public.rooms;
CREATE POLICY "shop members can view rooms"
  ON public.rooms FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = rooms.shop_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "owners can manage rooms" ON public.rooms;
CREATE POLICY "owners can manage rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = rooms.shop_id AND user_id = auth.uid() AND role = 'owner'
  ));

DROP POLICY IF EXISTS "owners can update rooms" ON public.rooms;
CREATE POLICY "owners can update rooms"
  ON public.rooms FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = rooms.shop_id AND user_id = auth.uid() AND role = 'owner'
  ));

DROP POLICY IF EXISTS "owners can delete rooms" ON public.rooms;
CREATE POLICY "owners can delete rooms"
  ON public.rooms FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = rooms.shop_id AND user_id = auth.uid() AND role = 'owner'
  ));

-- ── products INSERT, UPDATE, DELETE (SELECT already fixed in 021) ─────────────
DROP POLICY IF EXISTS "shop members can insert products" ON public.products;
CREATE POLICY "shop members can insert products"
  ON public.products FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = products.shop_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "shop members can update products" ON public.products;
CREATE POLICY "shop members can update products"
  ON public.products FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = products.shop_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "owners can delete products" ON public.products;
CREATE POLICY "owners can delete products"
  ON public.products FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = products.shop_id AND user_id = auth.uid() AND role = 'owner'
  ));

-- ── sales INSERT (SELECT already fixed in 021) ────────────────────────────────
DROP POLICY IF EXISTS "shop members can insert sales" ON public.sales;
CREATE POLICY "shop members can insert sales"
  ON public.sales FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = sales.shop_id AND user_id = auth.uid()
  ));

-- ── sale_items INSERT (SELECT already fixed in 021 with JOIN EXISTS) ──────────
DROP POLICY IF EXISTS "shop members can insert sale items" ON public.sale_items;
CREATE POLICY "shop members can insert sale items"
  ON public.sale_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.sales s
    JOIN public.shop_members sm ON sm.shop_id = s.shop_id
    WHERE s.id = sale_items.sale_id AND sm.user_id = auth.uid()
  ));

-- ── stock_movements INSERT (SELECT already fixed in 021) ──────────────────────
DROP POLICY IF EXISTS "shop members can insert movements" ON public.stock_movements;
CREATE POLICY "shop members can insert movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = stock_movements.shop_id AND user_id = auth.uid()
  ));

-- ── sync_queue ALL (IN → EXISTS) ──────────────────────────────────────────────
DROP POLICY IF EXISTS "shop members can manage sync queue" ON public.sync_queue;
CREATE POLICY "shop members can manage sync queue"
  ON public.sync_queue FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = sync_queue.shop_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = sync_queue.shop_id AND user_id = auth.uid()
  ));

-- ── purchase_orders SELECT, INSERT, UPDATE (IN → EXISTS) ──────────────────────
DROP POLICY IF EXISTS "shop members can view purchase orders" ON public.purchase_orders;
CREATE POLICY "shop members can view purchase orders"
  ON public.purchase_orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = purchase_orders.shop_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "owners can manage purchase orders" ON public.purchase_orders;
CREATE POLICY "owners can manage purchase orders"
  ON public.purchase_orders FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = purchase_orders.shop_id AND user_id = auth.uid() AND role = 'owner'
  ));

DROP POLICY IF EXISTS "owners can update purchase orders" ON public.purchase_orders;
CREATE POLICY "owners can update purchase orders"
  ON public.purchase_orders FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = purchase_orders.shop_id AND user_id = auth.uid() AND role = 'owner'
  ));

-- ── po_items SELECT, INSERT (nested IN → JOIN EXISTS) ─────────────────────────
DROP POLICY IF EXISTS "shop members can view po items" ON public.po_items;
CREATE POLICY "shop members can view po items"
  ON public.po_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.purchase_orders po
    JOIN public.shop_members sm ON sm.shop_id = po.shop_id
    WHERE po.id = po_items.po_id AND sm.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "owners can manage po items" ON public.po_items;
CREATE POLICY "owners can manage po items"
  ON public.po_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.purchase_orders po
    JOIN public.shop_members sm ON sm.shop_id = po.shop_id
    WHERE po.id = po_items.po_id AND sm.user_id = auth.uid() AND sm.role = 'owner'
  ));

-- ── shop_members owner SELECT and DELETE (IN → EXISTS) ────────────────────────
-- Inner subquery targets the caller's own row (visible via "members can view their own memberships")
DROP POLICY IF EXISTS "owners can view all members of their shop" ON public.shop_members;
CREATE POLICY "owners can view all members of their shop"
  ON public.shop_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.shop_members osm
    WHERE osm.shop_id = shop_members.shop_id
      AND osm.user_id = auth.uid()
      AND osm.role = 'owner'
  ));

DROP POLICY IF EXISTS "owners can remove members" ON public.shop_members;
CREATE POLICY "owners can remove members"
  ON public.shop_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.shop_members osm
    WHERE osm.shop_id = shop_members.shop_id
      AND osm.user_id = auth.uid()
      AND osm.role = 'owner'
  ));

-- ── profiles owner SELECT (double nested IN → single JOIN EXISTS) ─────────────
DROP POLICY IF EXISTS "owners can view shop profiles" ON public.profiles;
CREATE POLICY "owners can view shop profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.shop_members sm
    JOIN public.shop_members osm ON osm.shop_id = sm.shop_id
    WHERE sm.user_id  = profiles.id
      AND osm.user_id = auth.uid()
      AND osm.role    = 'owner'
  ));

COMMIT;
