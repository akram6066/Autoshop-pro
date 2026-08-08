BEGIN;

-- 1. Update get_sales_with_staff to accept optional start and end dates
DROP FUNCTION IF EXISTS public.get_sales_with_staff(uuid, int, int);

CREATE OR REPLACE FUNCTION public.get_sales_with_staff(
  p_shop_id  uuid,
  p_offset   int DEFAULT 0,
  p_limit    int DEFAULT 25,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id               uuid,
  total_amount     numeric,
  payment_method   text,
  created_at       timestamptz,
  staff_name       text,
  total_count      bigint,
  status           text,
  amount_paid      numeric,
  delivery_address text,
  invoice_number   text
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
    s.status,
    s.amount_paid,
    s.delivery_address,
    s.invoice_number
  FROM public.sales s
  LEFT JOIN public.profiles p ON p.id = s.user_id
  WHERE s.shop_id = p_shop_id
    AND (p_start_date IS NULL OR s.created_at >= p_start_date)
    AND (p_end_date IS NULL OR s.created_at <= p_end_date)
  ORDER BY s.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_sales_with_staff(uuid, int, int, timestamptz, timestamptz) TO authenticated;

COMMIT;
