-- ============================================================
-- 035_audit_product_changes.sql
-- Fires an audit_logs row on every product INSERT so the
-- activity page can show who added what to inventory.
-- auth.uid() is available in the trigger context because
-- products are always inserted from an authenticated client.
-- ============================================================

CREATE OR REPLACE FUNCTION public.audit_product_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      shop_id, user_id, event_type, entity_type, entity_id, payload, severity
    )
    VALUES (
      NEW.shop_id,
      auth.uid(),
      'PRODUCT_ADDED',
      'products',
      NEW.id,
      jsonb_build_object(
        'name',     NEW.name,
        'sku',      NEW.sku,
        'quantity', NEW.quantity,
        'price',    NEW.price
      ),
      'info'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_product_added ON public.products;

CREATE TRIGGER on_product_added
  AFTER INSERT ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.audit_product_change();
