BEGIN;

-- ============================================================
-- 022_audit_and_monitoring.sql
-- Implements an enterprise-grade audit logging system.
-- Tracks sensitive business actions, administrative changes,
-- and security-related events.
-- ============================================================

-- ─── 1. Audit Logs Table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     uuid          REFERENCES public.shops(id) ON DELETE SET NULL,
  user_id     uuid          REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type  text          NOT NULL, -- e.g., 'STAFF_INVITE', 'SALE_DELETE', 'LARGE_ADJUSTMENT'
  entity_type text          NOT NULL, -- e.g., 'shop_invites', 'sales', 'products'
  entity_id   uuid          NOT NULL,
  payload     jsonb         NOT NULL DEFAULT '{}',
  severity    text          NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
  ip_address  text,
  user_agent  text,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

-- Indexing for fast audit searches
CREATE INDEX idx_audit_logs_shop_id ON public.audit_logs(shop_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS (Read-only for owners, no direct client writes)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners can view shop audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = public.audit_logs.shop_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- ─── 2. Audit Logging RPC ───────────────────────────────────────────────────

-- SECURE function to log events from application code.
-- Only allows logging for shops where the user is a member.

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_shop_id     uuid,
  p_event_type  text,
  p_entity_type text,
  p_entity_id   uuid,
  p_payload     jsonb,
  p_severity    text DEFAULT 'info'
)
RETURNS void AS $$
BEGIN
  -- Validate Session
  IF auth.uid() IS NULL THEN
    -- System-level logs (e.g., during signup) might have null shop_id/user_id
    -- But we only allow authenticated users to call this specific RPC for multi-tenancy audit
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  -- Validate Membership if shop_id provided
  IF p_shop_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for this shop' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.audit_logs (
    shop_id, user_id, event_type, entity_type, entity_id, 
    payload, severity, ip_address, user_agent
  )
  VALUES (
    p_shop_id,
    auth.uid(),
    p_event_type,
    p_entity_type,
    p_entity_id,
    p_payload,
    p_severity,
    inet_client_addr()::text, -- Capture client IP from PG session if available
    NULL -- UA is better captured in the application layer
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated;

-- ─── 3. Triggers for Automatic Audit (Crucial Events) ──────────────────────

-- A) Audit Member Role Changes
CREATE OR REPLACE FUNCTION public.audit_member_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    INSERT INTO public.audit_logs (shop_id, user_id, event_type, entity_type, entity_id, payload, severity)
    VALUES (
      NEW.shop_id,
      auth.uid(),
      'MEMBER_ROLE_CHANGE',
      'shop_members',
      NEW.id,
      jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role, 'target_user', NEW.user_id),
      'warning'
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (shop_id, user_id, event_type, entity_type, entity_id, payload, severity)
    VALUES (
      OLD.shop_id,
      auth.uid(),
      'MEMBER_REMOVED',
      'shop_members',
      OLD.id,
      jsonb_build_object('removed_user', OLD.user_id),
      'warning'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_member_modified
  AFTER UPDATE OR DELETE ON public.shop_members
  FOR EACH ROW EXECUTE PROCEDURE public.audit_member_change();

-- B) Audit Large Stock Adjustments (> 100 units)
CREATE OR REPLACE FUNCTION public.audit_stock_adjustment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reason = 'adjustment' AND NEW.delta > 100 THEN
    INSERT INTO public.audit_logs (shop_id, user_id, event_type, entity_type, entity_id, payload, severity)
    VALUES (
      NEW.shop_id,
      NEW.user_id,
      'LARGE_STOCK_ADJUSTMENT',
      'stock_movements',
      NEW.id,
      jsonb_build_object('product_id', NEW.product_id, 'delta', NEW.delta, 'type', NEW.type),
      'warning'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_stock_adjustment
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE PROCEDURE public.audit_stock_adjustment();

COMMIT;
