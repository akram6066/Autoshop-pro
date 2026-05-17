-- ============================================================
-- 032_get_sales_with_staff.sql
-- Returns paginated sales with staff name resolved server-side.
-- SECURITY DEFINER bypasses RLS on profiles so historical staff
-- names (deleted/no shop_members row) still resolve correctly.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_sales_with_staff(
  p_shop_id  uuid,
  p_offset   int  DEFAULT 0,
  p_limit    int  DEFAULT 25
)
RETURNS TABLE (
  id             uuid,
  total_amount   numeric,
  payment_method text,
  created_at     timestamptz,
  staff_name     text,
  total_count    bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Any shop member (owner or staff) can call this for their shop
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
    COUNT(*) OVER ()                 AS total_count
  FROM public.sales s
  LEFT JOIN public.profiles p ON p.id = s.user_id
  WHERE s.shop_id = p_shop_id
  ORDER BY s.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_sales_with_staff(uuid, int, int) TO authenticated;
