BEGIN;

-- ============================================================
-- 039_audit_update_delete.sql
-- Extend product audit trigger to cover UPDATE and DELETE.
-- Add new trigger for product_variants UPDATE and DELETE.
-- Guard variant trigger against record_sale quantity deductions
-- (only fires when structural fields change, not quantity).
-- ============================================================

-- ─── 1. Products: INSERT + UPDATE + DELETE ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.audit_product_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      shop_id, user_id, event_type, entity_type, entity_id, payload, severity
    ) VALUES (
      NEW.shop_id, auth.uid(), 'PRODUCT_ADDED', 'products', NEW.id,
      jsonb_build_object('name', NEW.name, 'sku', NEW.sku,
                         'quantity', NEW.quantity, 'price', NEW.price),
      'info'
    );

  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log when metadata changed, not when record_sale deducts quantity
    IF (NEW.name      IS DISTINCT FROM OLD.name)
    OR (NEW.sku       IS DISTINCT FROM OLD.sku)
    OR (NEW.category  IS DISTINCT FROM OLD.category)
    OR (NEW.price     IS DISTINCT FROM OLD.price)
    OR (NEW.room_id   IS DISTINCT FROM OLD.room_id)
    OR (NEW.min_stock IS DISTINCT FROM OLD.min_stock)
    OR (NEW.size      IS DISTINCT FROM OLD.size) THEN
      INSERT INTO public.audit_logs (
        shop_id, user_id, event_type, entity_type, entity_id, payload, severity
      ) VALUES (
        NEW.shop_id, auth.uid(), 'PRODUCT_UPDATED', 'products', NEW.id,
        jsonb_build_object(
          'name',      NEW.name,
          'old_name',  OLD.name,
          'price',     NEW.price,
          'old_price', OLD.price,
          'category',  NEW.category
        ),
        'info'
      );
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      shop_id, user_id, event_type, entity_type, entity_id, payload, severity
    ) VALUES (
      OLD.shop_id, auth.uid(), 'PRODUCT_DELETED', 'products', OLD.id,
      jsonb_build_object('name', OLD.name, 'sku', OLD.sku, 'category', OLD.category),
      'warning'
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the INSERT-only trigger with one that covers all operations
DROP TRIGGER IF EXISTS on_product_added ON public.products;
DROP TRIGGER IF EXISTS on_product_change ON public.products;

CREATE TRIGGER on_product_change
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.audit_product_change();


-- ─── 2. Product variants: UPDATE + DELETE ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.audit_variant_change()
RETURNS TRIGGER AS $$
DECLARE
  v_shop_id     uuid;
  v_product_name text;
BEGIN
  SELECT p.shop_id, p.name INTO v_shop_id, v_product_name
  FROM public.products p
  WHERE p.id = COALESCE(NEW.product_id, OLD.product_id);

  IF TG_OP = 'UPDATE' THEN
    -- Only log structural changes; record_sale only changes quantity
    IF (NEW.size      IS DISTINCT FROM OLD.size)
    OR (NEW.sku       IS DISTINCT FROM OLD.sku)
    OR (NEW.price     IS DISTINCT FROM OLD.price)
    OR (NEW.min_stock IS DISTINCT FROM OLD.min_stock) THEN
      INSERT INTO public.audit_logs (
        shop_id, user_id, event_type, entity_type, entity_id, payload, severity
      ) VALUES (
        v_shop_id, auth.uid(), 'VARIANT_UPDATED', 'product_variants', NEW.id,
        jsonb_build_object(
          'product_name', v_product_name,
          'size',         NEW.size,
          'old_size',     OLD.size,
          'price',        NEW.price,
          'old_price',    OLD.price
        ),
        'info'
      );
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    -- Skip cascade deletes triggered by parent product deletion
    IF EXISTS (SELECT 1 FROM public.products WHERE id = OLD.product_id) THEN
      INSERT INTO public.audit_logs (
        shop_id, user_id, event_type, entity_type, entity_id, payload, severity
      ) VALUES (
        v_shop_id, auth.uid(), 'VARIANT_DELETED', 'product_variants', OLD.id,
        jsonb_build_object(
          'product_name', v_product_name,
          'size',         OLD.size,
          'sku',          OLD.sku
        ),
        'warning'
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_variant_change ON public.product_variants;

CREATE TRIGGER on_variant_change
  AFTER UPDATE OR DELETE ON public.product_variants
  FOR EACH ROW EXECUTE PROCEDURE public.audit_variant_change();

COMMIT;
