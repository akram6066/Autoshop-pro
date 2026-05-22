BEGIN;

-- ─── Subscription plans (admin-configurable) ──────────────────────────────────
CREATE TABLE public.subscription_plans (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text        NOT NULL UNIQUE,
  display_name            text        NOT NULL,
  price_kes               integer     NOT NULL DEFAULT 0,
  trial_days              integer     NOT NULL DEFAULT 30,
  max_shops               integer     NOT NULL DEFAULT 1,
  max_products_per_shop   integer     NOT NULL DEFAULT 50,
  max_staff_per_shop      integer     NOT NULL DEFAULT 2,
  max_sales_per_month     integer     NOT NULL DEFAULT 100,
  is_active               boolean     NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- Seed default plans (admin can edit price_kes from admin panel)
INSERT INTO public.subscription_plans
  (name, display_name, price_kes, trial_days, max_shops, max_products_per_shop, max_staff_per_shop, max_sales_per_month)
VALUES
  ('trial',        'Free Trial',             0,    30, 1,      50,     2,     100),
  ('pro',          'Pro',                    1000,  0, 5,      500,    10,    999999),
  ('free_forever', 'Free (Admin Override)',  0,     0, 999999, 999999, 999999, 999999);

-- ─── User subscriptions ───────────────────────────────────────────────────────
CREATE TABLE public.subscriptions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id             uuid        NOT NULL REFERENCES public.subscription_plans(id),
  status              text        NOT NULL DEFAULT 'trial'
                                  CHECK (status IN ('trial','active','expired','cancelled','free')),
  trial_ends_at       timestamptz,
  current_period_end  timestamptz,
  is_admin_override   boolean     NOT NULL DEFAULT false,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX idx_subscriptions_status  ON public.subscriptions (status);

-- ─── M-Pesa payments ──────────────────────────────────────────────────────────
CREATE TABLE public.mpesa_payments (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id      uuid        REFERENCES public.subscriptions(id),
  checkout_request_id  text        UNIQUE,
  merchant_request_id  text,
  amount_kes           integer     NOT NULL,
  phone_number         text        NOT NULL,
  mpesa_receipt_number text,
  status               text        NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('pending','completed','failed','cancelled')),
  result_code          integer,
  result_desc          text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  completed_at         timestamptz
);

CREATE INDEX idx_mpesa_user_id            ON public.mpesa_payments (user_id);
CREATE INDEX idx_mpesa_checkout_request_id ON public.mpesa_payments (checkout_request_id);

-- ─── Update product limit: free plan now 50 (was 500) ────────────────────────
CREATE OR REPLACE FUNCTION public.check_product_limit()
RETURNS trigger AS $$
DECLARE v_count int; v_plan text;
BEGIN
  SELECT plan INTO v_plan FROM public.shops WHERE id = NEW.shop_id;
  IF v_plan = 'pro' THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO v_count FROM public.products WHERE shop_id = NEW.shop_id;
  IF v_count >= 50 THEN
    RAISE EXCEPTION 'product_limit_reached: free plan allows 50 products per shop';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Monthly sales limit (new) ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_sales_monthly_limit()
RETURNS trigger AS $$
DECLARE v_count int; v_plan text; v_month_start timestamptz;
BEGIN
  SELECT plan INTO v_plan FROM public.shops WHERE id = NEW.shop_id;
  IF v_plan = 'pro' THEN RETURN NEW; END IF;
  v_month_start := date_trunc('month', now());
  SELECT COUNT(*) INTO v_count
  FROM public.sales
  WHERE shop_id = NEW.shop_id AND created_at >= v_month_start;
  IF v_count >= 100 THEN
    RAISE EXCEPTION 'sales_monthly_limit_reached: free plan allows 100 sales per month';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_sales_monthly_limit ON public.sales;
CREATE TRIGGER trg_check_sales_monthly_limit
  BEFORE INSERT ON public.sales
  FOR EACH ROW EXECUTE PROCEDURE public.check_sales_monthly_limit();

-- ─── Auto-create trial subscription on new profile ────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER AS $$
DECLARE v_plan_id uuid;
BEGIN
  SELECT id INTO v_plan_id
  FROM public.subscription_plans WHERE name = 'trial' AND is_active = true LIMIT 1;

  IF v_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, plan_id, status, trial_ends_at)
    VALUES (NEW.id, v_plan_id, 'trial', now() + INTERVAL '30 days')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_subscription ON public.profiles;
CREATE TRIGGER on_profile_created_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_subscription();

-- Backfill existing users who have no subscription yet
DO $$
DECLARE v_plan_id uuid;
BEGIN
  SELECT id INTO v_plan_id FROM public.subscription_plans WHERE name = 'trial' LIMIT 1;
  IF v_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, plan_id, status, trial_ends_at)
    SELECT p.id, v_plan_id, 'trial', now() + INTERVAL '30 days'
    FROM public.profiles p
    WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpesa_payments      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans are public readable"
  ON public.subscription_plans FOR SELECT USING (is_active = true);

CREATE POLICY "users can read own subscription"
  ON public.subscriptions FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users can read own payments"
  ON public.mpesa_payments FOR SELECT USING (user_id = auth.uid());

-- All writes go through service role (no public insert/update policies)

COMMIT;
