BEGIN;

-- Remove tax_rate from shops table
ALTER TABLE public.shops
DROP COLUMN IF EXISTS tax_rate;

COMMIT;
