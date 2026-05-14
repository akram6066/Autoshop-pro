-- ============================================================
-- 023_enhanced_monitoring.sql
-- Expands audit coverage to sensitive business data
-- and adds security event logging for auth failures.
-- ============================================================

-- ─── 1. Enhanced Triggers ───────────────────────────────────────────────────

-- A) Audit Product Sensitive Changes (Price & Deletion)
CREATE OR REPLACE FUNCTION public.audit_product_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (shop_id, user_id, event_type, entity_type, entity_id, payload, severity)
    VALUES (
      OLD.shop_id,
      auth.uid(),
      'PRODUCT_DELETED',
      'products',
      OLD.id,
      jsonb_build_object('name', OLD.name, 'sku', OLD.sku),
      'warning'
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log significant price changes (> 20%)
    IF ABS(NEW.price - OLD.price) / NULLIF(OLD.price, 0) > 0.20 THEN
      INSERT INTO public.audit_logs (shop_id, user_id, event_type, entity_type, entity_id, payload, severity)
      VALUES (
        NEW.shop_id,
        auth.uid(),
        'SIGNIFICANT_PRICE_CHANGE',
        'products',
        NEW.id,
        jsonb_build_object('old_price', OLD.price, 'new_price', NEW.price, 'sku', NEW.sku),
        'info'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_product_modified
  AFTER UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.audit_product_change();

-- B) Audit Sale Deletions (Critical)
CREATE OR REPLACE FUNCTION public.audit_sale_deletion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (shop_id, user_id, event_type, entity_type, entity_id, payload, severity)
  VALUES (
    OLD.shop_id,
    auth.uid(),
    'SALE_DELETED',
    'sales',
    OLD.id,
    jsonb_build_object('total_amount', OLD.total_amount, 'user_id', OLD.user_id, 'created_at', OLD.created_at),
    'critical'
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_sale_deleted
  AFTER DELETE ON public.sales
  FOR EACH ROW EXECUTE PROCEDURE public.audit_sale_deletion();

-- C) Audit Customer Deletions & Large Balance Changes
CREATE OR REPLACE FUNCTION public.audit_customer_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (shop_id, user_id, event_type, entity_type, entity_id, payload, severity)
    VALUES (
      OLD.shop_id,
      auth.uid(),
      'CUSTOMER_DELETED',
      'customers',
      OLD.id,
      jsonb_build_object('name', OLD.name, 'balance', OLD.balance),
      'warning'
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log large balance adjustments (> 5000)
    IF ABS(NEW.balance - OLD.balance) > 5000 THEN
      INSERT INTO public.audit_logs (shop_id, user_id, event_type, entity_type, entity_id, payload, severity)
      VALUES (
        NEW.shop_id,
        auth.uid(),
        'LARGE_BALANCE_ADJUSTMENT',
        'customers',
        NEW.id,
        jsonb_build_object('old_balance', OLD.balance, 'new_balance', NEW.balance, 'name', NEW.name),
        'warning'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_customer_modified
  AFTER UPDATE OR DELETE ON public.customers
  FOR EACH ROW execute PROCEDURE public.audit_customer_change();

-- D) Audit Shop Invitations
CREATE OR REPLACE FUNCTION public.audit_invite_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (shop_id, user_id, event_type, entity_type, entity_id, payload, severity)
    VALUES (
      NEW.shop_id,
      auth.uid(),
      'INVITE_CREATED',
      'shop_invites',
      NEW.id,
      jsonb_build_object('email', NEW.email, 'role', NEW.role),
      'info'
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (shop_id, user_id, event_type, entity_type, entity_id, payload, severity)
    VALUES (
      OLD.shop_id,
      auth.uid(),
      'INVITE_DELETED',
      'shop_invites',
      OLD.id,
      jsonb_build_object('email', OLD.email),
      'info'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Ensure shop_invites table exists (usually created in migration 020)
CREATE TRIGGER on_invite_modified
  AFTER INSERT OR DELETE ON public.shop_invites
  FOR EACH ROW EXECUTE PROCEDURE public.audit_invite_change();

-- ─── 2. Security Event RPC ───────────────────────────────────────────────────

-- Allows logging events like failed auth even when not logged in.
-- Restricts event types to prevent pollution.

CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type  text,
  p_payload     jsonb,
  p_severity    text DEFAULT 'warning'
)
RETURNS void AS $$
DECLARE
  v_allowed_types text[] := ARRAY['AUTH_FAILURE', 'SUSPICIOUS_REQUEST', 'RATE_LIMIT_EXCEEDED'];
BEGIN
  IF NOT (p_event_type = ANY(v_allowed_types)) AND auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Anonymous logging only allowed for security events' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.audit_logs (
    shop_id, user_id, event_type, entity_type, entity_id, 
    payload, severity, ip_address
  )
  VALUES (
    NULL, -- Security events might not be tied to a shop yet
    auth.uid(),
    p_event_type,
    'security',
    '00000000-0000-0000-0000-000000000000'::uuid,
    p_payload,
    p_severity,
    inet_client_addr()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.log_security_event TO anon, authenticated;

-- ─── 3. System Health Check Table ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.system_health (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  component     text          NOT NULL,
  status        text          NOT NULL, -- 'healthy', 'degraded', 'down'
  latency_ms    integer,
  message       text,
  created_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_health_component ON public.system_health(component, created_at DESC);

-- RLS: Only admins (system-level) or via RPC. Let's keep it simple for now.
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can see health" ON public.system_health FOR SELECT USING (true);
