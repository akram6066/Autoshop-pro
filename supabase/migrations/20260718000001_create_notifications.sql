BEGIN;

-- 1. Create shop_notifications table
CREATE TABLE IF NOT EXISTS public.shop_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shop_notifications_shop_id ON public.shop_notifications(shop_id);
CREATE INDEX idx_shop_notifications_is_read ON public.shop_notifications(is_read);

-- 2. Enable RLS and add policies
ALTER TABLE public.shop_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop members can view notifications"
  ON public.shop_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = public.shop_notifications.shop_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "shop members can update notifications"
  ON public.shop_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_id = public.shop_notifications.shop_id
      AND user_id = auth.uid()
    )
  );

-- 3. Update execute_inventory_transfer to insert notifications
CREATE OR REPLACE FUNCTION public.execute_inventory_transfer(
  p_source_product_id uuid,
  p_variant_id uuid,
  p_dest_shop_id uuid,
  p_dest_room_id uuid,
  p_quantity integer,
  p_transfer_date timestamp with time zone DEFAULT now()
) RETURNS uuid AS $$
DECLARE
  v_source_shop_id uuid;
  v_source_room_id uuid;
  v_source_shop_name text;
  v_source_room_name text;
  v_source_qty integer;
  v_dest_product_id uuid;
  v_dest_variant_id uuid;
  v_dest_qty integer;
  v_sku text;
  v_name text;
  v_category text;
  v_min_stock integer;
  v_price numeric(12,2);
  v_size text;
  
  v_var_size text;
  v_var_sku text;
  v_var_price numeric(12,2);
  v_var_min_stock integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Transfer quantity must be greater than 0';
  END IF;

  -- 1. Get Source Product Info and Verify Authorization
  SELECT shop_id, room_id, sku, name, category, min_stock, price, size
  INTO v_source_shop_id, v_source_room_id, v_sku, v_name, v_category, v_min_stock, v_price, v_size
  FROM public.products
  WHERE id = p_source_product_id;

  IF v_source_shop_id IS NULL THEN
    RAISE EXCEPTION 'Source product not found';
  END IF;

  -- Fetch source shop and room names for notification
  SELECT s.name, r.name 
  INTO v_source_shop_name, v_source_room_name
  FROM public.shops s
  JOIN public.rooms r ON r.id = v_source_room_id
  WHERE s.id = v_source_shop_id;

  -- Verify user is in source shop
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members 
    WHERE shop_id = v_source_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for source shop' USING ERRCODE = '42501';
  END IF;

  -- Verify user is in destination shop
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members 
    WHERE shop_id = p_dest_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for destination shop' USING ERRCODE = '42501';
  END IF;

  IF p_variant_id IS NOT NULL THEN
    -- ── Variant Transfer Logic ─────────────────────────────────────────
    SELECT size, sku, price, min_stock, quantity
    INTO v_var_size, v_var_sku, v_var_price, v_var_min_stock, v_source_qty
    FROM public.product_variants
    WHERE id = p_variant_id AND product_id = p_source_product_id
    FOR UPDATE;

    IF v_source_qty IS NULL THEN
      RAISE EXCEPTION 'Variant not found';
    END IF;
    
    IF v_source_qty < p_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for transfer';
    END IF;

    -- Deduct from Source Variant
    UPDATE public.product_variants
    SET quantity = quantity - p_quantity
    WHERE id = p_variant_id;

    INSERT INTO public.stock_movements (
      shop_id, product_id, variant_id, type, delta, snapshot_qty, device_id, reason, user_id, synced, created_at
    ) VALUES (
      v_source_shop_id, p_source_product_id, p_variant_id, 'OUT', p_quantity, v_source_qty - p_quantity, 'transfer_to:' || p_dest_shop_id || ':' || p_dest_room_id, 'transfer', auth.uid(), true, COALESCE(p_transfer_date, now())
    );
    
    -- Handle Destination Parent Product
    SELECT id INTO v_dest_product_id
    FROM public.products
    WHERE shop_id = p_dest_shop_id AND sku = v_sku
    LIMIT 1;

    IF v_dest_product_id IS NULL THEN
      INSERT INTO public.products (shop_id, room_id, name, sku, category, min_stock, price, size)
      VALUES (p_dest_shop_id, p_dest_room_id, v_name, v_sku, v_category, v_min_stock, v_price, v_size)
      RETURNING id INTO v_dest_product_id;
    END IF;

    -- Handle Destination Variant
    SELECT id, quantity INTO v_dest_variant_id, v_dest_qty
    FROM public.product_variants
    WHERE product_id = v_dest_product_id AND size = v_var_size
    FOR UPDATE;

    IF v_dest_variant_id IS NULL THEN
      INSERT INTO public.product_variants (product_id, size, sku, price, quantity, min_stock)
      VALUES (v_dest_product_id, v_var_size, v_var_sku, v_var_price, p_quantity, v_var_min_stock)
      RETURNING id INTO v_dest_variant_id;
      
      v_dest_qty := 0;
    ELSE
      UPDATE public.product_variants
      SET quantity = quantity + p_quantity
      WHERE id = v_dest_variant_id;
    END IF;

    -- Log IN movement at destination
    INSERT INTO public.stock_movements (
      shop_id, product_id, variant_id, type, delta, snapshot_qty, device_id, reason, user_id, synced, created_at
    ) VALUES (
      p_dest_shop_id, v_dest_product_id, v_dest_variant_id, 'IN', p_quantity, v_dest_qty + p_quantity, 'transfer_from:' || v_source_shop_id || ':' || v_source_room_id, 'transfer', auth.uid(), true, COALESCE(p_transfer_date, now())
    );

    -- Insert Notification
    INSERT INTO public.shop_notifications (shop_id, title, message)
    VALUES (
      p_dest_shop_id, 
      'Incoming Transfer', 
      'Received ' || p_quantity || ' units of ' || v_name || ' (' || v_var_size || ') from ' || v_source_shop_name || ' (' || v_source_room_name || ')'
    );

    RETURN v_dest_product_id;

  ELSE
    -- ── Legacy Product Transfer Logic ──────────────────────────────────
    SELECT quantity INTO v_source_qty
    FROM public.products
    WHERE id = p_source_product_id
    FOR UPDATE;

    IF v_source_qty < p_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for transfer';
    END IF;

    -- Deduct from Source Product
    UPDATE public.products
    SET quantity = quantity - p_quantity, updated_at = now()
    WHERE id = p_source_product_id;

    INSERT INTO public.stock_movements (
      shop_id, product_id, type, delta, snapshot_qty, device_id, reason, user_id, synced, created_at
    ) VALUES (
      v_source_shop_id, p_source_product_id, 'OUT', p_quantity, v_source_qty - p_quantity, 'transfer_to:' || p_dest_shop_id || ':' || p_dest_room_id, 'transfer', auth.uid(), true, COALESCE(p_transfer_date, now())
    );

    -- Handle Destination Product
    SELECT id, quantity INTO v_dest_product_id, v_dest_qty
    FROM public.products
    WHERE shop_id = p_dest_shop_id AND sku = v_sku
    FOR UPDATE;

    IF v_dest_product_id IS NULL THEN
      INSERT INTO public.products (shop_id, room_id, name, sku, category, quantity, min_stock, price, size)
      VALUES (p_dest_shop_id, p_dest_room_id, v_name, v_sku, v_category, p_quantity, v_min_stock, v_price, v_size)
      RETURNING id INTO v_dest_product_id;
      
      v_dest_qty := 0;
    ELSE
      UPDATE public.products
      SET quantity = quantity + p_quantity, updated_at = now()
      WHERE id = v_dest_product_id;
    END IF;

    -- Log IN movement at destination
    INSERT INTO public.stock_movements (
      shop_id, product_id, type, delta, snapshot_qty, device_id, reason, user_id, synced, created_at
    ) VALUES (
      p_dest_shop_id, v_dest_product_id, 'IN', p_quantity, v_dest_qty + p_quantity, 'transfer_from:' || v_source_shop_id || ':' || v_source_room_id, 'transfer', auth.uid(), true, COALESCE(p_transfer_date, now())
    );

    -- Insert Notification
    INSERT INTO public.shop_notifications (shop_id, title, message)
    VALUES (
      p_dest_shop_id, 
      'Incoming Transfer', 
      'Received ' || p_quantity || ' units of ' || v_name || ' from ' || v_source_shop_name || ' (' || v_source_room_name || ')'
    );

    RETURN v_dest_product_id;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
