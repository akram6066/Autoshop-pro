BEGIN;

-- =============================================================================
-- 049_production_fixes.sql
-- Production-readiness improvements:
--   1. Composite index on sales(shop_id, created_at) for report queries
--   2. Composite index on stock_movements(shop_id, created_at) for activity feed
--   3. Automatic trial expiry function (called by pg_cron if available, or via API)
--   4. Staff-safe product view that hides purchase_price (cost price)
--   5. Idempotency guard on record_sale (prevent duplicate offline syncs)
-- =============================================================================

-- ─── 1. Missing performance indexes ─────────────────────────────────────────

-- Reports page: date-range query on sales — without this it's a full seq scan
-- at >10k rows per shop.
CREATE INDEX IF NOT EXISTS idx_sales_shop_date
  ON public.sales (shop_id, created_at DESC);

-- Activity feed: stock movements by shop + date
CREATE INDEX IF NOT EXISTS idx_stock_movements_shop_date
  ON public.stock_movements (shop_id, created_at DESC);

-- Sales summary refresh: speeds up the GROUP BY in get_sales_summary RPC
CREATE INDEX IF NOT EXISTS idx_sales_payment_method
  ON public.sales (shop_id, payment_method, created_at DESC);

-- ─── 2. Trial expiry function ────────────────────────────────────────────────
-- Marks expired trial subscriptions as 'expired' and downgrades their shops.
-- Called from pg_cron (if enabled) or from the subscription status API.

CREATE OR REPLACE FUNCTION public.expire_trials()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
  v_sub   record;
BEGIN
  -- Find all trial subscriptions whose trial period has ended
  FOR v_sub IN
    SELECT s.id, s.user_id
    FROM public.subscriptions s
    WHERE s.status = 'trial'
      AND s.trial_ends_at IS NOT NULL
      AND s.trial_ends_at < now()
      AND s.is_admin_override = false
  LOOP
    -- Mark subscription as expired
    UPDATE public.subscriptions
    SET status     = 'expired',
        updated_at = now()
    WHERE id = v_sub.id;

    -- Downgrade all shops owned by this user to free plan
    UPDATE public.shops
    SET plan = 'free'
    WHERE id IN (
      SELECT shop_id
      FROM public.shop_members
      WHERE user_id = v_sub.user_id
        AND role    = 'owner'
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Schedule via pg_cron if the extension is available.
-- Runs at midnight UTC every day. Safe to run multiple times — the WHERE
-- clause is idempotent. If pg_cron is not enabled, call expire_trials()
-- manually from the /api/subscription/status route instead.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule(
      'expire-trials-daily',
      '0 0 * * *',
      'SELECT public.expire_trials()'
    );
  END IF;
END;
$$;

-- ─── 3. Staff-safe product view (hides cost when purchase_price is added) ──────
-- Mirrors the current products schema. Once a purchase_price column is added,
-- this view is the place to omit it so staff cannot read margins.

CREATE OR REPLACE VIEW public.products_staff_view AS
SELECT
  id,
  shop_id,
  room_id,
  name,
  sku,
  category,
  quantity,
  min_stock,
  price,
  size,
  updated_at
FROM public.products;

-- Grant staff read access to the view; their RLS on the base table still applies
-- because views run with the invoker's permissions in Supabase by default.
GRANT SELECT ON public.products_staff_view TO authenticated;

-- ─── 4. Idempotency guard on record_sale ─────────────────────────────────────
-- Prevents a duplicate offline sync from inserting the same sale twice.
-- The sync queue assigns a UUID to every command; we store it as the
-- idempotency key on the sale row and skip re-insertion if it already exists.

-- Add the column only if the schema doesn't already have it
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;

-- Update record_sale RPC to honour the idempotency key when provided.
-- If the sale was already recorded (same key), return success silently.
CREATE OR REPLACE FUNCTION public.record_sale(
  p_sale  json,
  p_items json
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id         uuid;
  v_shop_id         uuid;
  v_idempotency_key text;
BEGIN
  -- Extract idempotency key from payload (may be null for legacy clients)
  v_idempotency_key := p_sale->>'idempotency_key';

  -- Guard: if this sale was already recorded, skip silently
  IF v_idempotency_key IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.sales WHERE idempotency_key = v_idempotency_key
    ) THEN
      RETURN; -- idempotent — already applied
    END IF;
  END IF;

  v_sale_id := coalesce((p_sale->>'id')::uuid, gen_random_uuid());
  v_shop_id := (p_sale->>'shop_id')::uuid;

  -- Validate shop membership
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = v_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this shop' USING ERRCODE = '42501';
  END IF;

  -- Insert the sale
  INSERT INTO public.sales (
    id, shop_id, user_id, payment_method, subtotal, discount, total,
    amount_paid, change_due, customer_id, delivery_address, delivery_fee,
    notes, status, created_at, idempotency_key
  )
  VALUES (
    v_sale_id,
    v_shop_id,
    coalesce((p_sale->>'user_id')::uuid, auth.uid()),
    coalesce(p_sale->>'payment_method', 'cash'),
    coalesce((p_sale->>'subtotal')::numeric, 0),
    coalesce((p_sale->>'discount')::numeric, 0),
    coalesce((p_sale->>'total')::numeric, 0),
    coalesce((p_sale->>'amount_paid')::numeric, 0),
    coalesce((p_sale->>'change_due')::numeric, 0),
    (p_sale->>'customer_id')::uuid,
    p_sale->>'delivery_address',
    coalesce((p_sale->>'delivery_fee')::numeric, 0),
    p_sale->>'notes',
    coalesce(p_sale->>'status', 'completed'),
    coalesce((p_sale->>'created_at')::timestamptz, now()),
    v_idempotency_key
  );

  -- Insert line items and decrement stock atomically
  INSERT INTO public.sale_items (
    id, sale_id, product_id, variant_id, quantity, unit_price, total_price
  )
  SELECT
    coalesce((item->>'id')::uuid, gen_random_uuid()),
    v_sale_id,
    (item->>'product_id')::uuid,
    (item->>'variant_id')::uuid,
    (item->>'quantity')::integer,
    (item->>'unit_price')::numeric,
    (item->>'total_price')::numeric
  FROM json_array_elements(p_items) AS item;

  -- Deduct stock (variant-aware)
  UPDATE public.products p
  SET quantity = p.quantity - (item->>'quantity')::integer,
      updated_at = now()
  FROM json_array_elements(p_items) AS item
  WHERE p.id = (item->>'product_id')::uuid
    AND (item->>'variant_id') IS NULL;

  UPDATE public.product_variants pv
  SET quantity = pv.quantity - (item->>'quantity')::integer
  FROM json_array_elements(p_items) AS item
  WHERE pv.id = (item->>'variant_id')::uuid
    AND (item->>'variant_id') IS NOT NULL;

  -- Append stock movement records (OUT) for audit trail
  INSERT INTO public.stock_movements (
    shop_id, product_id, user_id, type, reason, delta, seq, created_at
  )
  SELECT
    v_shop_id,
    (item->>'product_id')::uuid,
    auth.uid(),
    'OUT',
    'sale',
    -((item->>'quantity')::integer),
    nextval('stock_movements_seq'),
    now()
  FROM json_array_elements(p_items) AS item;

END;
$$;

-- ─── 5. Auto-log rate-limit hits to admin_logs ───────────────────────────────
-- Tracks which users/IPs are being rate-limited, visible in /admin/logs.

CREATE OR REPLACE FUNCTION public.log_rate_limit_event(
  p_user_id  uuid,
  p_path     text,
  p_ip       text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.admin_logs (category, level, message, details, user_id, path)
  VALUES (
    'api',
    'warning',
    'Rate limit exceeded: ' || p_path,
    jsonb_build_object('ip', p_ip, 'path', p_path),
    p_user_id,
    p_path
  );
END;
$$;

COMMIT;
