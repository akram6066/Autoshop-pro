-- ============================================================
-- 20261026150000_fix_product_limit_archived_count.sql
--
-- Fix check_product_limit to exclude archived/soft-deleted products.
-- Previously, COUNT(*) counted all rows including is_archived = true,
-- preventing free-plan shops from creating new products even after
-- deleting old ones.
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_product_limit()
RETURNS trigger AS $$
DECLARE v_count int; v_plan text;
BEGIN
  SELECT plan INTO v_plan FROM public.shops WHERE id = NEW.shop_id;
  -- Paid plans (pro, ultra_pro) and admin-overridden free_forever are unlimited
  IF v_plan IN ('pro', 'ultra_pro', 'free_forever') THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO v_count FROM public.products WHERE shop_id = NEW.shop_id AND is_archived = false;
  IF v_count >= 50 THEN
    RAISE EXCEPTION 'product_limit_reached: free plan allows 50 products per shop';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
