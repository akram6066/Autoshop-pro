BEGIN;

-- ============================================================
-- 030_fix_staff_delete.sql
-- Fix staff account deletion: sales.user_id and stock_movements.user_id
-- block auth.admin.deleteUser because they are NOT NULL + ON DELETE RESTRICT.
-- Change to nullable + ON DELETE SET NULL so business history is preserved
-- (sale/movement rows stay, user_id becomes NULL) when a staff user is deleted.
-- ============================================================

-- ─── sales.user_id ───────────────────────────────────────────────────────────

ALTER TABLE public.sales
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.sales
  DROP CONSTRAINT IF EXISTS sales_user_id_fkey;

ALTER TABLE public.sales
  ADD CONSTRAINT sales_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ─── stock_movements.user_id ─────────────────────────────────────────────────

ALTER TABLE public.stock_movements
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.stock_movements
  DROP CONSTRAINT IF EXISTS stock_movements_user_id_fkey;

ALTER TABLE public.stock_movements
  ADD CONSTRAINT stock_movements_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ─── purchase_orders.received_by ─────────────────────────────────────────────
-- Already nullable; change from default NO ACTION to ON DELETE SET NULL.

ALTER TABLE public.purchase_orders
  DROP CONSTRAINT IF EXISTS purchase_orders_received_by_fkey;

ALTER TABLE public.purchase_orders
  ADD CONSTRAINT purchase_orders_received_by_fkey
  FOREIGN KEY (received_by) REFERENCES auth.users(id) ON DELETE SET NULL;

COMMIT;
