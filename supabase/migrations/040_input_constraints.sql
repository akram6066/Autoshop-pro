BEGIN;

-- ============================================================
-- 040_input_constraints.sql
-- Production-grade CHECK constraints for all user-input columns.
-- Adds: text length limits, numeric range guards, color format.
-- Safe to run on existing data — limits are generous enough to
-- never reject real shop data.
-- ============================================================

-- ─── products ────────────────────────────────────────────────────────────────

ALTER TABLE public.products
  ADD CONSTRAINT products_name_length
    CHECK (char_length(name) >= 1 AND char_length(name) <= 500),
  ADD CONSTRAINT products_sku_length
    CHECK (char_length(sku) <= 100),
  ADD CONSTRAINT products_size_length
    CHECK (size IS NULL OR char_length(size) <= 100),
  ADD CONSTRAINT products_category_length
    CHECK (char_length(category) <= 100);
-- NOTE: price >= 0, quantity >= 0, min_stock >= 0 already exist (migration 001)

-- ─── product_variants ────────────────────────────────────────────────────────

ALTER TABLE public.product_variants
  ADD CONSTRAINT variants_size_length
    CHECK (char_length(trim(size)) >= 1 AND char_length(size) <= 100),
  ADD CONSTRAINT variants_sku_length
    CHECK (sku IS NULL OR char_length(sku) <= 100),
  ADD CONSTRAINT variants_price_positive
    CHECK (price >= 0),
  ADD CONSTRAINT variants_quantity_positive
    CHECK (quantity >= 0),
  ADD CONSTRAINT variants_min_stock_positive
    CHECK (min_stock >= 0);

-- ─── shops ───────────────────────────────────────────────────────────────────

ALTER TABLE public.shops
  ADD CONSTRAINT shops_name_length
    CHECK (char_length(trim(name)) >= 1 AND char_length(name) <= 200),
  ADD CONSTRAINT shops_address_length
    CHECK (address IS NULL OR char_length(address) <= 500);

-- ─── rooms ───────────────────────────────────────────────────────────────────

ALTER TABLE public.rooms
  ADD CONSTRAINT rooms_name_length
    CHECK (char_length(trim(name)) >= 1 AND char_length(name) <= 200);

-- ─── profiles ────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_full_name_length
    CHECK (char_length(full_name) <= 200);

-- ─── categories ──────────────────────────────────────────────────────────────

ALTER TABLE public.categories
  ADD CONSTRAINT categories_name_length
    CHECK (char_length(trim(name)) >= 1 AND char_length(name) <= 100),
  ADD CONSTRAINT categories_color_format
    CHECK (color ~ '^#[0-9a-fA-F]{6}$');

-- ─── customers ───────────────────────────────────────────────────────────────

ALTER TABLE public.customers
  ADD CONSTRAINT customers_name_length
    CHECK (char_length(trim(name)) >= 1 AND char_length(name) <= 200),
  ADD CONSTRAINT customers_phone_length
    CHECK (phone IS NULL OR char_length(phone) <= 30);

-- ─── sales ───────────────────────────────────────────────────────────────────

ALTER TABLE public.sales
  ADD CONSTRAINT sales_total_amount_positive
    CHECK (total_amount >= 0),
  ADD CONSTRAINT sales_delivery_address_length
    CHECK (delivery_address IS NULL OR char_length(delivery_address) <= 500);

-- ─── sale_items ──────────────────────────────────────────────────────────────

ALTER TABLE public.sale_items
  ADD CONSTRAINT sale_items_unit_price_positive
    CHECK (unit_price >= 0);
-- NOTE: quantity > 0 already exists (migration 001)

-- ─── customer_payments ───────────────────────────────────────────────────────

ALTER TABLE public.customer_payments
  ADD CONSTRAINT customer_payments_note_length
    CHECK (note IS NULL OR char_length(note) <= 500);
-- NOTE: amount > 0 already exists (migration 017)

-- ─── po_items ────────────────────────────────────────────────────────────────

ALTER TABLE public.po_items
  ADD CONSTRAINT po_items_unit_cost_positive
    CHECK (unit_cost >= 0);
-- NOTE: qty_expected > 0 already exists (migration 001)

COMMIT;
