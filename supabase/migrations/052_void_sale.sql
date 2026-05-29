BEGIN;

-- ─── 1. Add status column to sales ───────────────────────────────────────────
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed'
  CONSTRAINT sales_status_check CHECK (status IN ('completed', 'voided'));

-- ─── 2. Update get_sales_with_staff to return status ─────────────────────────
DROP FUNCTION IF EXISTS public.get_sales_with_staff(uuid, int, int);

CREATE OR REPLACE FUNCTION public.get_sales_with_staff(
  p_shop_id  uuid,
  p_offset   int DEFAULT 0,
  p_limit    int DEFAULT 25
)
RETURNS TABLE (
  id             uuid,
  total_amount   numeric,
  payment_method text,
  created_at     timestamptz,
  staff_name     text,
  total_count    bigint,
  status         text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.total_amount,
    s.payment_method::text,
    s.created_at,
    COALESCE(p.full_name, 'Unknown') AS staff_name,
    COUNT(*) OVER ()                 AS total_count,
    s.status
  FROM public.sales s
  LEFT JOIN public.profiles p ON p.id = s.user_id
  WHERE s.shop_id = p_shop_id
  ORDER BY s.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_sales_with_staff(uuid, int, int) TO authenticated;

-- ─── 3. void_sale RPC (owner only) ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.void_sale(
  p_sale_id  uuid,
  p_shop_id  uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  -- Only owners may void a sale
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id
      AND user_id = auth.uid()
      AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only shop owners can void sales' USING ERRCODE = '42501';
  END IF;

  -- Fetch and lock the sale row
  SELECT status INTO v_status
  FROM public.sales
  WHERE id = p_sale_id AND shop_id = p_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_status = 'voided' THEN
    RAISE EXCEPTION 'Sale is already voided' USING ERRCODE = 'P0002';
  END IF;

  -- Mark sale as voided
  UPDATE public.sales
  SET status = 'voided'
  WHERE id = p_sale_id AND shop_id = p_shop_id;

  -- Restore stock quantity for every item in the sale
  UPDATE public.products p
  SET quantity = p.quantity + si.quantity
  FROM public.sale_items si
  WHERE si.sale_id   = p_sale_id
    AND si.product_id = p.id
    AND p.shop_id     = p_shop_id;

  -- Record an IN stock movement for each restored item
  INSERT INTO public.stock_movements (
    shop_id, product_id, type, delta, snapshot_qty,
    device_id, reason, user_id
  )
  SELECT
    p_shop_id,
    si.product_id,
    'IN',
    si.quantity,
    p.quantity,          -- snapshot after restore
    'server-void',
    'adjustment',
    auth.uid()
  FROM public.sale_items si
  JOIN public.products p
    ON p.id = si.product_id AND p.shop_id = p_shop_id
  WHERE si.sale_id = p_sale_id;

END;
$$;

GRANT EXECUTE ON FUNCTION public.void_sale(uuid, uuid) TO authenticated;

COMMIT;
