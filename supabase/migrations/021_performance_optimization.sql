-- ============================================================
-- 021_performance_optimization.sql
-- Optimizes RLS and Indexing for high-scale multi-tenancy.
-- Replaces slow 'IN' subqueries with 'EXISTS'.
-- Adds missing compound indexes for common query patterns.
-- ============================================================

-- ─── 1. RLS Optimization (EXISTS vs IN) ──────────────────────────────────────

-- products
DROP POLICY IF EXISTS "shop members can view products" ON public.products;
CREATE POLICY "shop_members_select_products" ON public.products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = public.products.shop_id AND user_id = auth.uid()
    )
  );

-- sales
DROP POLICY IF EXISTS "shop members can view sales" ON public.sales;
CREATE POLICY "shop_members_select_sales" ON public.sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = public.sales.shop_id AND user_id = auth.uid()
    )
  );

-- sale_items
DROP POLICY IF EXISTS "shop members can view sale items" ON public.sale_items;
CREATE POLICY "shop_members_select_sale_items" ON public.sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sales s
      JOIN public.shop_members sm ON sm.shop_id = s.shop_id
      WHERE s.id = public.sale_items.sale_id AND sm.user_id = auth.uid()
    )
  );

-- stock_movements
DROP POLICY IF EXISTS "shop members can view movements" ON public.stock_movements;
CREATE POLICY "shop_members_select_movements" ON public.stock_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = public.stock_movements.shop_id AND user_id = auth.uid()
    )
  );

-- customer_payments
DROP POLICY IF EXISTS "shop members can view payments" ON public.customer_payments;
CREATE POLICY "shop_members_select_payments" ON public.customer_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = public.customer_payments.shop_id AND user_id = auth.uid()
    )
  );

-- customers
DROP POLICY IF EXISTS "shop members can view customers" ON public.customers;
CREATE POLICY "shop_members_select_customers" ON public.customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = public.customers.shop_id AND user_id = auth.uid()
    )
  );

-- ─── 2. Index Optimization ───────────────────────────────────────────────────

-- Sales: Compound index for reports and dashboard
CREATE INDEX IF NOT EXISTS idx_sales_shop_id_created_at ON public.sales(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);

-- Sale Items: Foreign key index
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);

-- Stock Movements: Audit trail compound index
CREATE INDEX IF NOT EXISTS idx_movements_shop_id_created_at ON public.stock_movements(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_product_id ON public.stock_movements(product_id);

-- Products: SKU lookup per shop
CREATE INDEX IF NOT EXISTS idx_products_shop_id_sku ON public.products(shop_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_shop_id_quantity ON public.products(shop_id, quantity); -- Fast low stock check

-- Shop Members: Membership lookup
CREATE INDEX IF NOT EXISTS idx_shop_members_user_id_shop_id ON public.shop_members(user_id, shop_id);

-- ─── 3. Vacuum & Analyze (Post-Migration Maintenance) ─────────────────────────

ANALYZE public.products;
ANALYZE public.sales;
ANALYZE public.stock_movements;
ANALYZE public.shop_members;
