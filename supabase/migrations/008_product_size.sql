-- ============================================================
-- 008_product_size.sql
-- Add nullable size column to products table.
-- ============================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS size text;
