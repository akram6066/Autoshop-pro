-- ==============================================================================
-- Rollback for 20261004130000_locations_inventory_reconcile.sql
-- Run MANUALLY (SQL editor). Deliberately NOT in supabase/migrations so the CLI
-- never applies it, and with no BEGIN/COMMIT so you control the transaction.
--
-- Data is preserved: inventory_levels / stock_transfers / items are kept (they are
-- additive). Only the behaviour added by the migration is removed.
-- After running this, re-apply supabase/migrations/20260808105700_block_same_shop_transfers.sql
-- if you also want the pre-Locations execute_inventory_transfer back.
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_products_to_levels ON public.products;
DROP TRIGGER IF EXISTS trg_variants_to_levels ON public.product_variants;
DROP FUNCTION IF EXISTS public.trg_products_to_levels();
DROP FUNCTION IF EXISTS public.trg_variants_to_levels();
DROP FUNCTION IF EXISTS public.level_sync_suspended();
DROP FUNCTION IF EXISTS public.apply_total_delta_to_levels(uuid, uuid, uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.adjust_inventory_level(uuid, uuid, uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.reconcile_inventory_levels();
DROP FUNCTION IF EXISTS public.preview_stock_transfer(uuid, uuid, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.execute_inventory_transfer(uuid, uuid, uuid, uuid, integer, timestamptz);
DROP FUNCTION IF EXISTS public.transfer_stock(uuid, uuid, uuid, uuid, uuid, uuid, integer, text, timestamptz);
