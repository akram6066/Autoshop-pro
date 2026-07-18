BEGIN;

-- Trigger function for stock alerts
CREATE OR REPLACE FUNCTION public.trigger_check_stock_levels()
RETURNS trigger AS $$
DECLARE
  v_name text;
  v_shop_id uuid;
BEGIN
  -- Only alert if quantity actually decreased
  IF NEW.quantity < OLD.quantity THEN
    
    -- Handle Product Variants
    IF TG_TABLE_NAME = 'product_variants' THEN
      SELECT name, shop_id INTO v_name, v_shop_id FROM public.products WHERE id = NEW.product_id;
      v_name := v_name || ' (' || NEW.size || ')';
      
      IF NEW.quantity <= 0 AND OLD.quantity > 0 THEN
        INSERT INTO public.shop_notifications (shop_id, title, message)
        VALUES (v_shop_id, 'Stock Out Alert', 'Variant "' || v_name || '" has run out of stock.');
      ELSIF NEW.quantity <= NEW.min_stock AND OLD.quantity > NEW.min_stock THEN
        INSERT INTO public.shop_notifications (shop_id, title, message)
        VALUES (v_shop_id, 'Low Stock Alert', 'Variant "' || v_name || '" is below minimum stock level (' || NEW.quantity || ' left).');
      END IF;

    -- Handle Parent Products
    ELSIF TG_TABLE_NAME = 'products' THEN
      IF NEW.quantity <= 0 AND OLD.quantity > 0 THEN
        INSERT INTO public.shop_notifications (shop_id, title, message)
        VALUES (NEW.shop_id, 'Stock Out Alert', 'Product "' || NEW.name || '" has run out of stock.');
      ELSIF NEW.quantity <= NEW.min_stock AND OLD.quantity > NEW.min_stock THEN
        INSERT INTO public.shop_notifications (shop_id, title, message)
        VALUES (NEW.shop_id, 'Low Stock Alert', 'Product "' || NEW.name || '" is below minimum stock level (' || NEW.quantity || ' left).');
      END IF;
    END IF;

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to products
DROP TRIGGER IF EXISTS trg_check_stock_products ON public.products;
CREATE TRIGGER trg_check_stock_products
  AFTER UPDATE OF quantity ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_check_stock_levels();

-- Attach trigger to product_variants
DROP TRIGGER IF EXISTS trg_check_stock_variants ON public.product_variants;
CREATE TRIGGER trg_check_stock_variants
  AFTER UPDATE OF quantity ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_check_stock_levels();

-- Add delete policy for notifications (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'shop members can delete notifications' AND tablename = 'shop_notifications'
  ) THEN
    CREATE POLICY "shop members can delete notifications"
      ON public.shop_notifications FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.shop_members
          WHERE shop_id = public.shop_notifications.shop_id
          AND user_id = auth.uid()
        )
      );
  END IF;
END
$$;

COMMIT;
