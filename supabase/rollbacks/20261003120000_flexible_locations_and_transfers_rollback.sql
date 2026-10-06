BEGIN;

-- ==============================================================================
-- 20261003120000_flexible_locations_and_transfers_rollback.sql
-- Rolls back flexible locations and drops the syncing triggers.
-- ==============================================================================

-- 1. Drop inter-shop location transfer RPC
DROP FUNCTION IF EXISTS public.transfer_location(uuid, uuid, uuid, boolean);

-- 2. Drop inter-location stock transfer RPC
DROP FUNCTION IF EXISTS public.transfer_stock_between_locations(uuid, uuid, uuid, uuid, text, jsonb);

-- 3. Drop triggers
DROP TRIGGER IF EXISTS trg_sync_inventory_to_legacy ON public.inventory_levels;
DROP FUNCTION IF EXISTS public.sync_inventory_to_legacy();

DROP TRIGGER IF EXISTS trg_sync_variant_to_inventory ON public.product_variants;
DROP FUNCTION IF EXISTS public.sync_variant_to_inventory();

DROP TRIGGER IF EXISTS trg_sync_product_to_inventory ON public.products;
DROP FUNCTION IF EXISTS public.sync_product_to_inventory();

-- 4. Revert products.room_id to NOT NULL
-- (Must ensure no products have null room_id before doing this)
-- First, assign a default room if any were made null
UPDATE public.products 
SET room_id = (SELECT id FROM public.rooms WHERE shop_id = public.products.shop_id LIMIT 1)
WHERE room_id IS NULL;

ALTER TABLE public.products ALTER COLUMN room_id SET NOT NULL;

-- 5. Drop new tables
DROP TABLE IF EXISTS public.stock_transfer_items CASCADE;
DROP TABLE IF EXISTS public.stock_transfers CASCADE;
DROP TABLE IF EXISTS public.inventory_levels CASCADE;

COMMIT;
