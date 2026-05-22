BEGIN;

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS deleted_at  timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shops_deleted_at
  ON public.shops (deleted_at)
  WHERE deleted_at IS NOT NULL;

COMMIT;
