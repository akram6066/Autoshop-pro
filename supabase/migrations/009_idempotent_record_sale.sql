BEGIN;

CREATE OR REPLACE FUNCTION public.record_sale(
  p_sale jsonb,
  p_items jsonb
)
RETURNS uuid AS $$
DECLARE
  v_sale_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_unit_price numeric;
  v_current_qty integer;
BEGIN
  v_sale_id := (p_sale->>'id')::uuid;

  -- If sale already exists, return early (idempotent retry)
  IF EXISTS (SELECT 1 FROM public.sales WHERE id = v_sale_id) THEN
    RETURN v_sale_id;
  END IF;

  INSERT INTO public.sales (id, shop_id, user_id, total_amount, synced, created_at)
  VALUES (
    v_sale_id,
    (p_sale->>'shop_id')::uuid,
    (p_sale->>'user_id')::uuid,
    (p_sale->>'total_amount')::numeric,
    true,
    coalesce((p_sale->>'created_at')::timestamptz, now())
  );

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;

    SELECT quantity INTO v_current_qty
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF v_current_qty < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
    END IF;

    INSERT INTO public.sale_items (id, sale_id, product_id, quantity, unit_price)
    VALUES (
      coalesce((v_item->>'id')::uuid, gen_random_uuid()),
      v_sale_id,
      v_product_id,
      v_qty,
      v_unit_price
    );

    UPDATE public.products
    SET quantity = quantity - v_qty, updated_at = now()
    WHERE id = v_product_id;

    INSERT INTO public.stock_movements (
      shop_id, product_id, type, delta, snapshot_qty,
      device_id, reason, user_id, synced
    )
    VALUES (
      (p_sale->>'shop_id')::uuid,
      v_product_id,
      'OUT',
      v_qty,
      v_current_qty - v_qty,
      coalesce(p_sale->>'device_id', 'server'),
      'sale',
      (p_sale->>'user_id')::uuid,
      true
    );
  END LOOP;

  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
