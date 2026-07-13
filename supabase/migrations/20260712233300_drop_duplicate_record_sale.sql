BEGIN;

-- Drop the old record_sale(json, json) function which conflicts with the newer record_sale(jsonb, jsonb)
DROP FUNCTION IF EXISTS public.record_sale(json, json);

COMMIT;
