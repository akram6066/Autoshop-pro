BEGIN;

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
  v_transfer_id uuid;
  
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

  SELECT shop_id, room_id, sku, name, category, min_stock, price, size
  INTO v_source_shop_id, v_source_room_id, v_sku, v_name, v_category, v_min_stock, v_price, v_size
  FROM public.products
  WHERE id = p_source_product_id;

  IF v_source_shop_id IS NULL THEN
    RAISE EXCEPTION 'Source product not found';
  END IF;

  -- Validate same room transfer
  IF v_source_shop_id = p_dest_shop_id AND (v_source_room_id = p_dest_room_id OR (v_source_room_id IS NULL AND p_dest_room_id IS NULL)) THEN
    RAISE EXCEPTION 'Cannot transfer inventory to the exact same location.';
  END IF;

  -- Fetch source shop and room names
  SELECT s.name, COALESCE(r.name, 'Unassigned')
  INTO v_source_shop_name, v_source_room_name
  FROM public.shops s
  LEFT JOIN public.rooms r ON r.id = v_source_room_id
  WHERE s.id = v_source_shop_id;

  IF NOT EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = v_source_shop_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized for source shop' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = p_dest_shop_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized for destination shop' USING ERRCODE = '42501';
  END IF;

  v_transfer_id := gen_random_uuid();
  INSERT INTO public.stock_transfers (id, from_shop_id, to_shop_id, from_room_id, to_room_id, user_id, reason, transfer_date)
  VALUES (v_transfer_id, v_source_shop_id, p_dest_shop_id, v_source_room_id, p_dest_room_id, auth.uid(), 'UI Transfer', COALESCE(p_transfer_date, now()));

  IF v_source_shop_id = p_dest_shop_id THEN
    -- ========================================================
    -- SAME SHOP TRANSFER: Move between inventory_levels directly
    -- ========================================================
    
    -- Verify stock
    SELECT quantity INTO v_source_qty FROM public.inventory_levels 
    WHERE shop_id = v_source_shop_id AND (room_id = v_source_room_id OR v_source_room_id IS NULL)
      AND product_id = p_source_product_id AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL))
    FOR UPDATE;

    -- Fallback to product/variant quantity if inventory_level missing
    IF v_source_qty IS NULL THEN
        IF p_variant_id IS NOT NULL THEN
            SELECT quantity INTO v_source_qty FROM public.product_variants WHERE id = p_variant_id;
        ELSE
            v_source_qty := (SELECT quantity FROM public.products WHERE id = p_source_product_id);
        END IF;
    END IF;

    IF v_source_qty IS NULL OR v_source_qty < p_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for transfer';
    END IF;

    -- Deduct from source
    UPDATE public.inventory_levels SET quantity = quantity - p_quantity
    WHERE shop_id = v_source_shop_id AND (room_id = v_source_room_id OR (v_source_room_id IS NULL AND room_id IS NULL))
      AND product_id = p_source_product_id AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL));

    -- Add to destination (creates if not exists)
    INSERT INTO public.inventory_levels (shop_id, room_id, product_id, variant_id, quantity)
    VALUES (p_dest_shop_id, p_dest_room_id, p_source_product_id, p_variant_id, p_quantity)
    ON CONFLICT (shop_id, room_id, product_id, variant_id) 
    DO UPDATE SET quantity = public.inventory_levels.quantity + EXCLUDED.quantity;

    INSERT INTO public.stock_transfer_items (transfer_id, product_id, variant_id, quantity)
    VALUES (v_transfer_id, p_source_product_id, p_variant_id, p_quantity);

    -- Log movement OUT and IN
    INSERT INTO public.stock_movements (shop_id, product_id, variant_id, type, delta, snapshot_qty, device_id, reason, user_id, synced, created_at) 
    VALUES (v_source_shop_id, p_source_product_id, p_variant_id, 'OUT', p_quantity, v_source_qty - p_quantity, 'transfer_to:' || COALESCE(p_dest_room_id::text, ''), 'transfer', auth.uid(), true, COALESCE(p_transfer_date, now()));
    
    INSERT INTO public.stock_movements (shop_id, product_id, variant_id, type, delta, snapshot_qty, device_id, reason, user_id, synced, created_at) 
    VALUES (p_dest_shop_id, p_source_product_id, p_variant_id, 'IN', p_quantity, v_source_qty, 'transfer_from:' || COALESCE(v_source_room_id::text, ''), 'transfer', auth.uid(), true, COALESCE(p_transfer_date, now()));

    RETURN p_source_product_id;
  ELSE
    -- ========================================================
    -- CROSS SHOP TRANSFER: Clone product and variant
    -- ========================================================
    IF p_variant_id IS NOT NULL THEN
      SELECT size, sku, price, min_stock, quantity
      INTO v_var_size, v_var_sku, v_var_price, v_var_min_stock, v_source_qty
      FROM public.product_variants
      WHERE id = p_variant_id AND product_id = p_source_product_id
      FOR UPDATE;

      IF v_source_qty < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock for transfer';
      END IF;

      UPDATE public.product_variants SET quantity = quantity - p_quantity WHERE id = p_variant_id;

      SELECT id INTO v_dest_product_id FROM public.products WHERE shop_id = p_dest_shop_id AND sku = v_sku LIMIT 1;
      IF v_dest_product_id IS NULL THEN
        INSERT INTO public.products (shop_id, room_id, name, sku, category, min_stock, price, size)
        VALUES (p_dest_shop_id, p_dest_room_id, v_name, v_sku, v_category, v_min_stock, v_price, v_size)
        RETURNING id INTO v_dest_product_id;
      END IF;

      SELECT id, quantity INTO v_dest_variant_id, v_dest_qty
      FROM public.product_variants WHERE product_id = v_dest_product_id AND size = v_var_size FOR UPDATE;

      IF v_dest_variant_id IS NULL THEN
        INSERT INTO public.product_variants (product_id, size, sku, price, quantity, min_stock)
        VALUES (v_dest_product_id, v_var_size, v_var_sku, v_var_price, p_quantity, v_var_min_stock)
        RETURNING id INTO v_dest_variant_id;
        v_dest_qty := 0;
      ELSE
        UPDATE public.product_variants SET quantity = quantity + p_quantity WHERE id = v_dest_variant_id;
      END IF;

      INSERT INTO public.stock_transfer_items (transfer_id, product_id, variant_id, quantity)
      VALUES (v_transfer_id, v_dest_product_id, v_dest_variant_id, p_quantity);

      RETURN v_dest_product_id;
    ELSE
      SELECT quantity INTO v_source_qty FROM public.products WHERE id = p_source_product_id FOR UPDATE;

      IF v_source_qty < p_quantity THEN RAISE EXCEPTION 'Insufficient stock for transfer'; END IF;

      UPDATE public.products SET quantity = quantity - p_quantity, updated_at = now() WHERE id = p_source_product_id;

      SELECT id, quantity INTO v_dest_product_id, v_dest_qty FROM public.products WHERE shop_id = p_dest_shop_id AND sku = v_sku FOR UPDATE;

      IF v_dest_product_id IS NULL THEN
        INSERT INTO public.products (shop_id, room_id, name, sku, category, quantity, min_stock, price, size)
        VALUES (p_dest_shop_id, p_dest_room_id, v_name, v_sku, v_category, p_quantity, v_min_stock, v_price, v_size)
        RETURNING id INTO v_dest_product_id;
        v_dest_qty := 0;
      ELSE
        UPDATE public.products SET quantity = quantity + p_quantity, updated_at = now() WHERE id = v_dest_product_id;
      END IF;

      INSERT INTO public.stock_transfer_items (transfer_id, product_id, variant_id, quantity)
      VALUES (v_transfer_id, v_dest_product_id, NULL, p_quantity);

      RETURN v_dest_product_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
