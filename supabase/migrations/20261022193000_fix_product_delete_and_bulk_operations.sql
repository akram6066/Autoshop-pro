-- ==============================================================================
-- 20261022193000_fix_product_delete_and_bulk_operations.sql
--
-- Fixes product deletion & adds bulk product operations:
-- 1. Ensures is_archived and lifecycle columns exist on public.products.
-- 2. Makes manage_product DELETE resilient (handles foreign key constraints from
--    historical sales/transfers by soft-archiving instead of throwing FK violations).
-- 3. Adds bulk_delete_products RPC for fast, atomic multi-product deletion.
-- ==============================================================================

-- ─── 1. Product Lifecycle & Archiving Columns ─────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archive_reason text;

CREATE INDEX IF NOT EXISTS idx_products_shop_archived
  ON public.products (shop_id, is_archived);

-- ─── 2. Resilient manage_product RPC ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.manage_product(
  p_op text, -- 'INSERT' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'RESTORE'
  p_product jsonb
)
RETURNS uuid AS $$
DECLARE
  v_product_id      uuid;
  v_shop_id         uuid;
  v_caller_is_admin boolean := false;
  v_caller_is_owner boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  v_product_id := (p_product->>'id')::uuid;
  v_shop_id    := (p_product->>'shop_id')::uuid;

  IF v_product_id IS NULL OR v_shop_id IS NULL THEN
    RAISE EXCEPTION 'Missing product id or shop_id' USING ERRCODE = '22000';
  END IF;

  -- Check if caller is super admin
  SELECT COALESCE(is_admin, false) INTO v_caller_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  -- Check if caller is owner in shop_members
  SELECT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = v_shop_id AND user_id = auth.uid() AND role = 'owner'
  ) INTO v_caller_is_owner;

  -- Ensure caller is member of this shop or admin
  IF NOT v_caller_is_admin AND NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = v_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF p_op = 'INSERT' THEN
    INSERT INTO public.products (
      id, shop_id, room_id, name, sku, category, quantity, min_stock, price, size, is_archived
    )
    VALUES (
      v_product_id, v_shop_id, (p_product->>'room_id')::uuid,
      p_product->>'name', p_product->>'sku', p_product->>'category',
      COALESCE((p_product->>'quantity')::integer, 0),
      COALESCE((p_product->>'min_stock')::integer, 5),
      COALESCE((p_product->>'price')::numeric, 0),
      p_product->>'size',
      false
    )
    ON CONFLICT (id) DO NOTHING;

  ELSIF p_op = 'UPDATE' THEN
    UPDATE public.products
    SET
      room_id = COALESCE((p_product->>'room_id')::uuid, room_id),
      name = COALESCE(p_product->>'name', name),
      sku = COALESCE(p_product->>'sku', sku),
      category = COALESCE(p_product->>'category', category),
      min_stock = COALESCE((p_product->>'min_stock')::integer, min_stock),
      price = COALESCE((p_product->>'price')::numeric, price),
      size = COALESCE(p_product->>'size', size),
      updated_at = now()
    WHERE id = v_product_id AND shop_id = v_shop_id;

  ELSIF p_op = 'ARCHIVE' THEN
    IF NOT v_caller_is_admin AND NOT v_caller_is_owner AND NOT EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = v_shop_id AND user_id = auth.uid() AND role IN ('owner', 'manager')
    ) THEN
      RAISE EXCEPTION 'Only owners and managers can archive products' USING ERRCODE = '42501';
    END IF;

    UPDATE public.products
    SET
      is_archived = true,
      archived_at = now(),
      archive_reason = COALESCE(p_product->>'reason', 'Archived by user'),
      updated_at = now()
    WHERE id = v_product_id AND shop_id = v_shop_id;

  ELSIF p_op = 'RESTORE' THEN
    IF NOT v_caller_is_admin AND NOT v_caller_is_owner AND NOT EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = v_shop_id AND user_id = auth.uid() AND role IN ('owner', 'manager')
    ) THEN
      RAISE EXCEPTION 'Only owners and managers can restore products' USING ERRCODE = '42501';
    END IF;

    UPDATE public.products
    SET
      is_archived = false,
      archived_at = NULL,
      archive_reason = NULL,
      updated_at = now()
    WHERE id = v_product_id AND shop_id = v_shop_id;

  ELSIF p_op = 'DELETE' THEN
    IF NOT v_caller_is_admin AND NOT v_caller_is_owner THEN
      RAISE EXCEPTION 'Only owners can delete products' USING ERRCODE = '42501';
    END IF;

    BEGIN
      -- Try hard deletion first (clearing non-restricted child records)
      DELETE FROM public.inventory_levels WHERE product_id = v_product_id AND shop_id = v_shop_id;
      DELETE FROM public.product_variants WHERE product_id = v_product_id;
      DELETE FROM public.products WHERE id = v_product_id AND shop_id = v_shop_id;
    EXCEPTION WHEN foreign_key_violation THEN
      -- If foreign key constraint triggers (e.g. historical sales, invoices, or transfers),
      -- soft-archive to protect historical audit & ledger records
      UPDATE public.products
      SET
        is_archived = true,
        archived_at = now(),
        archive_reason = COALESCE(p_product->>'reason', 'Deleted/Archived by owner'),
        updated_at = now()
      WHERE id = v_product_id AND shop_id = v_shop_id;
    END;
  END IF;

  RETURN v_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 3. Atomic Bulk Delete RPC ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bulk_delete_products(
  p_shop_id     uuid,
  p_product_ids uuid[]
)
RETURNS uuid[] AS $$
DECLARE
  v_caller_is_admin boolean := false;
  v_caller_is_owner boolean := false;
  v_pid             uuid;
  v_deleted_ids     uuid[] := ARRAY[]::uuid[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(is_admin, false) INTO v_caller_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  SELECT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid() AND role = 'owner'
  ) INTO v_caller_is_owner;

  IF NOT v_caller_is_admin AND NOT v_caller_is_owner THEN
    RAISE EXCEPTION 'Only owners can bulk delete products' USING ERRCODE = '42501';
  END IF;

  FOREACH v_pid IN ARRAY p_product_ids LOOP
    BEGIN
      DELETE FROM public.inventory_levels WHERE product_id = v_pid AND shop_id = p_shop_id;
      DELETE FROM public.product_variants WHERE product_id = v_pid;
      DELETE FROM public.products WHERE id = v_pid AND shop_id = p_shop_id;
      v_deleted_ids := array_append(v_deleted_ids, v_pid);
    EXCEPTION WHEN foreign_key_violation THEN
      UPDATE public.products
      SET
        is_archived = true,
        archived_at = now(),
        archive_reason = 'Bulk deleted by owner',
        updated_at = now()
      WHERE id = v_pid AND shop_id = p_shop_id;
      v_deleted_ids := array_append(v_deleted_ids, v_pid);
    END;
  END LOOP;

  RETURN v_deleted_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.manage_product(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_delete_products(uuid, uuid[]) TO authenticated;
