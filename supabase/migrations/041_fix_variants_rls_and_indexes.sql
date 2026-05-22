BEGIN;

-- ============================================================
-- 041_fix_variants_rls_and_indexes.sql
--
-- Three targeted fixes for tables added/modified in migration 037.
--
-- 1. product_variants RLS: replace IN subqueries with EXISTS.
--    Migration 021 applied this fix to products, sales, sale_items,
--    stock_movements, customers, and customer_payments — but
--    product_variants was introduced in 037, after that refactor.
--    EXISTS short-circuits on first match; IN must fully materialise
--    the subquery result set before the row comparison begins.
--    At scale (thousands of products per shop) the difference is
--    significant on every SELECT/INSERT/UPDATE/DELETE.
--
-- 2. Partial indexes on sale_items.variant_id and
--    stock_movements.variant_id (both columns added in 037 with no
--    indexes). Partial (WHERE IS NOT NULL) because the majority of
--    rows are non-variant — a full index would carry dead weight and
--    slow down inserts for no benefit on the common case.
-- ============================================================

-- ─── 1. product_variants RLS ─────────────────────────────────────────────────
-- Drop all four existing policies by their exact names from migration 037,
-- then recreate using EXISTS + a JOIN through products → shop_members.
-- The planner can use idx_product_variants_product_id +
-- idx_shop_members_user_id_shop_id (both exist) for the inner lookup.

DROP POLICY IF EXISTS "shop members can view product variants"   ON public.product_variants;
DROP POLICY IF EXISTS "shop members can insert product variants" ON public.product_variants;
DROP POLICY IF EXISTS "shop members can update product variants" ON public.product_variants;
DROP POLICY IF EXISTS "shop members can delete product variants" ON public.product_variants;

CREATE POLICY "pv_select" ON public.product_variants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   public.products     p
      JOIN   public.shop_members sm ON sm.shop_id = p.shop_id
      WHERE  p.id        = product_variants.product_id
        AND  sm.user_id  = auth.uid()
    )
  );

CREATE POLICY "pv_insert" ON public.product_variants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM   public.products     p
      JOIN   public.shop_members sm ON sm.shop_id = p.shop_id
      WHERE  p.id        = product_variants.product_id
        AND  sm.user_id  = auth.uid()
    )
  );

CREATE POLICY "pv_update" ON public.product_variants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM   public.products     p
      JOIN   public.shop_members sm ON sm.shop_id = p.shop_id
      WHERE  p.id        = product_variants.product_id
        AND  sm.user_id  = auth.uid()
    )
  );

CREATE POLICY "pv_delete" ON public.product_variants
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM   public.products     p
      JOIN   public.shop_members sm ON sm.shop_id = p.shop_id
      WHERE  p.id        = product_variants.product_id
        AND  sm.user_id  = auth.uid()
    )
  );

-- ─── 2. Partial indexes on variant_id foreign keys ───────────────────────────

-- sale_items.variant_id: needed for "all sales of this variant" queries and
-- for the ON DELETE SET NULL cascade scan when a variant is deleted.
CREATE INDEX IF NOT EXISTS idx_sale_items_variant_id
  ON public.sale_items (variant_id)
  WHERE variant_id IS NOT NULL;

-- stock_movements.variant_id: needed for per-variant audit trail queries and
-- for the ON DELETE SET NULL cascade scan.
CREATE INDEX IF NOT EXISTS idx_stock_movements_variant_id
  ON public.stock_movements (variant_id)
  WHERE variant_id IS NOT NULL;

-- ─── 3. Refresh planner statistics ───────────────────────────────────────────

ANALYZE public.product_variants;
ANALYZE public.sale_items;
ANALYZE public.stock_movements;

COMMIT;
