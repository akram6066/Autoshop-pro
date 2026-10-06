BEGIN;

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
      v_name := v_name || COALESCE(' - ' || NULLIF(NEW.size, ''), '');
      IF NEW.sku IS NOT NULL AND NEW.sku != '' THEN
         v_name := v_name || ' (SKU: ' || NEW.sku || ')';
      END IF;
      
      IF NEW.quantity <= 0 AND OLD.quantity > 0 THEN
        INSERT INTO public.shop_notifications (shop_id, title, message)
        VALUES (v_shop_id, 'Stock Out Alert', 'Variant "' || v_name || '" has run out of stock.');
      ELSIF NEW.quantity <= NEW.min_stock AND OLD.quantity > NEW.min_stock THEN
        INSERT INTO public.shop_notifications (shop_id, title, message)
        VALUES (v_shop_id, 'Low Stock Alert', 'Variant "' || v_name || '" is below minimum stock level (' || NEW.quantity || ' left).');
      END IF;

    -- Handle Parent Products
    ELSIF TG_TABLE_NAME = 'products' THEN
      v_name := NEW.name || COALESCE(' - ' || NULLIF(NEW.size, ''), '');
      IF NEW.sku IS NOT NULL AND NEW.sku != '' THEN
         v_name := v_name || ' (SKU: ' || NEW.sku || ')';
      END IF;

      IF NEW.quantity <= 0 AND OLD.quantity > 0 THEN
        INSERT INTO public.shop_notifications (shop_id, title, message)
        VALUES (NEW.shop_id, 'Stock Out Alert', 'Product "' || v_name || '" has run out of stock.');
      ELSIF NEW.quantity <= NEW.min_stock AND OLD.quantity > NEW.min_stock THEN
        INSERT INTO public.shop_notifications (shop_id, title, message)
        VALUES (NEW.shop_id, 'Low Stock Alert', 'Product "' || v_name || '" is below minimum stock level (' || NEW.quantity || ' left).');
      END IF;
    END IF;

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
