BEGIN;

-- ============================================================
-- 007_categories_owner.sql
-- Recreate categories table with owner_id (per-user, not per-shop).
-- Drops the shop_id version from migration 004 which caused cache errors.
-- ============================================================

DROP TABLE IF EXISTS public.categories CASCADE;

CREATE TABLE public.categories (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  color      text        NOT NULL DEFAULT '#3b6ef5',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, name)
);

CREATE INDEX idx_categories_owner_id ON public.categories(owner_id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own categories"
  ON public.categories FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Seed default categories for the calling user (no shop_id needed)
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS void AS $$
BEGIN
  INSERT INTO public.categories (name, color) VALUES
    ('Tire',    '#3b6ef5'),
    ('Battery', '#d97706'),
    ('Rim',     '#16a34a')
  ON CONFLICT (owner_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
