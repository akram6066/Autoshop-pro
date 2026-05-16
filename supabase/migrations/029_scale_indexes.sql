-- Scale indexes: add missing indexes that become slow at millions of rows

-- products: shop+category filter (e.g. "show all tires for this shop")
CREATE INDEX IF NOT EXISTS idx_products_shop_category
  ON products(shop_id, category);

-- stock_movements: shop+seq for ordered movement feeds per shop
CREATE INDEX IF NOT EXISTS idx_stock_movements_shop_seq
  ON stock_movements(shop_id, seq);

-- stock_movements: who made an adjustment (audit log queries)
CREATE INDEX IF NOT EXISTS idx_stock_movements_user
  ON stock_movements(user_id);

-- sales: who made a sale (per-staff reporting)
CREATE INDEX IF NOT EXISTS idx_sales_user
  ON sales(user_id);

-- sale_items: RLS subquery `SELECT id FROM sales WHERE shop_id = auth_shop_id()`
-- currently hits sale_items via sale_id; a covering index avoids the subquery seq scan
CREATE INDEX IF NOT EXISTS idx_sales_shop_id
  ON sales(shop_id, id);

-- po_items: same pattern for purchase order RLS subquery
CREATE INDEX IF NOT EXISTS idx_purchase_orders_shop_id
  ON purchase_orders(shop_id, id);

-- sync_queue: composite status lookup used by flushQueue()
CREATE INDEX IF NOT EXISTS idx_sync_queue_shop_status_created
  ON sync_queue(shop_id, status, created_at);
