BEGIN;

-- ============================================================
-- 006_staff_and_fixes.sql
-- A) Backfill shop_members for existing owners
-- B) Rewrite all RLS policies to be multi-shop aware
-- C) Staff management RPCs
-- D) switch_active_shop RPC
-- ============================================================

-- ─── A) Backfill shop_members ─────────────────────────────────────────────────
-- Users who created shops before migration 004 have no shop_members row.
-- Insert them as owners based on profiles where role='owner' and shop_id IS NOT NULL.

INSERT INTO public.shop_members (shop_id, user_id, role)
SELECT p.shop_id, p.id, 'owner'
FROM public.profiles p
WHERE p.shop_id IS NOT NULL
  AND p.role = 'owner'
  AND NOT EXISTS (
    SELECT 1 FROM public.shop_members sm
    WHERE sm.shop_id = p.shop_id AND sm.user_id = p.id
  );

-- ─── B) Rewrite RLS policies to use shop_members subquery ─────────────────────
-- Replace single-shop auth_shop_id() with multi-shop shop_members check.

-- shops
DROP POLICY IF EXISTS "shop members can view their shop" ON public.shops;
CREATE POLICY "shop members can view their shop"
  ON public.shops FOR SELECT
  USING (id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid()));

-- rooms
DROP POLICY IF EXISTS "shop members can view rooms" ON public.rooms;
CREATE POLICY "shop members can view rooms"
  ON public.rooms FOR SELECT
  USING (shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "owners can manage rooms" ON public.rooms;
CREATE POLICY "owners can manage rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "owners can update rooms" ON public.rooms;
CREATE POLICY "owners can update rooms"
  ON public.rooms FOR UPDATE
  USING (shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "owners can delete rooms" ON public.rooms;
CREATE POLICY "owners can delete rooms"
  ON public.rooms FOR DELETE
  USING (shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid() AND role = 'owner'));

-- products
DROP POLICY IF EXISTS "shop members can view products" ON public.products;
CREATE POLICY "shop members can view products"
  ON public.products FOR SELECT
  USING (shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "shop members can insert products" ON public.products;
CREATE POLICY "shop members can insert products"
  ON public.products FOR INSERT
  WITH CHECK (shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "shop members can update products" ON public.products;
CREATE POLICY "shop members can update products"
  ON public.products FOR UPDATE
  USING (shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "owners can delete products" ON public.products;
CREATE POLICY "owners can delete products"
  ON public.products FOR DELETE
  USING (shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid() AND role = 'owner'));

-- sales
DROP POLICY IF EXISTS "shop members can view sales" ON public.sales;
CREATE POLICY "shop members can view sales"
  ON public.sales FOR SELECT
  USING (shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "shop members can insert sales" ON public.sales;
CREATE POLICY "shop members can insert sales"
  ON public.sales FOR INSERT
  WITH CHECK (shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid()));

-- sale_items
DROP POLICY IF EXISTS "shop members can view sale items" ON public.sale_items;
CREATE POLICY "shop members can view sale items"
  ON public.sale_items FOR SELECT
  USING (
    sale_id IN (
      SELECT id FROM public.sales
      WHERE shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "shop members can insert sale items" ON public.sale_items;
CREATE POLICY "shop members can insert sale items"
  ON public.sale_items FOR INSERT
  WITH CHECK (
    sale_id IN (
      SELECT id FROM public.sales
      WHERE shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid())
    )
  );

-- stock_movements
DROP POLICY IF EXISTS "shop members can view movements" ON public.stock_movements;
CREATE POLICY "shop members can view movements"
  ON public.stock_movements FOR SELECT
  USING (shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "shop members can insert movements" ON public.stock_movements;
CREATE POLICY "shop members can insert movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid()));

-- sync_queue
DROP POLICY IF EXISTS "shop members can manage sync queue" ON public.sync_queue;
CREATE POLICY "shop members can manage sync queue"
  ON public.sync_queue FOR ALL
  USING (shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid()));

-- purchase_orders
DROP POLICY IF EXISTS "shop members can view purchase orders" ON public.purchase_orders;
CREATE POLICY "shop members can view purchase orders"
  ON public.purchase_orders FOR SELECT
  USING (shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "owners can manage purchase orders" ON public.purchase_orders;
CREATE POLICY "owners can manage purchase orders"
  ON public.purchase_orders FOR INSERT
  WITH CHECK (shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid() AND role = 'owner'));

DROP POLICY IF EXISTS "owners can update purchase orders" ON public.purchase_orders;
CREATE POLICY "owners can update purchase orders"
  ON public.purchase_orders FOR UPDATE
  USING (shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid() AND role = 'owner'));

-- po_items
DROP POLICY IF EXISTS "shop members can view po items" ON public.po_items;
CREATE POLICY "shop members can view po items"
  ON public.po_items FOR SELECT
  USING (
    po_id IN (
      SELECT id FROM public.purchase_orders
      WHERE shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "owners can manage po items" ON public.po_items;
CREATE POLICY "owners can manage po items"
  ON public.po_items FOR INSERT
  WITH CHECK (
    po_id IN (
      SELECT id FROM public.purchase_orders
      WHERE shop_id IN (SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid() AND role = 'owner')
    )
  );

-- profiles: owners can see all members across their shops
DROP POLICY IF EXISTS "owners can view shop profiles" ON public.profiles;
CREATE POLICY "owners can view shop profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT user_id FROM public.shop_members
      WHERE shop_id IN (
        SELECT shop_id FROM public.shop_members
        WHERE user_id = auth.uid() AND role = 'owner'
      )
    )
  );

-- ─── C) Staff management RPCs ─────────────────────────────────────────────────

-- get_shop_team: returns all members of a shop with their profile info
CREATE OR REPLACE FUNCTION public.get_shop_team(p_shop_id uuid)
RETURNS TABLE (user_id uuid, role text, full_name text) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this shop';
  END IF;

  RETURN QUERY
  SELECT sm.user_id, sm.role::text, p.full_name
  FROM public.shop_members sm
  JOIN public.profiles p ON p.id = sm.user_id
  WHERE sm.shop_id = p_shop_id
  ORDER BY sm.role DESC, p.full_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- add_staff_member: owner adds a user to the shop as staff by email
-- Returns: 'added' | 'user_not_found' | 'already_member'
CREATE OR REPLACE FUNCTION public.add_staff_member(
  p_shop_id uuid,
  p_email text
)
RETURNS text AS $$
DECLARE
  v_target_id uuid;
  v_existing text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid() AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Not authorized — you must be an owner of this shop';
  END IF;

  SELECT id INTO v_target_id
  FROM auth.users
  WHERE email = lower(trim(p_email))
  LIMIT 1;

  IF v_target_id IS NULL THEN
    RETURN 'user_not_found';
  END IF;

  SELECT role INTO v_existing
  FROM public.shop_members
  WHERE shop_id = p_shop_id AND user_id = v_target_id;

  IF v_existing IS NOT NULL THEN
    RETURN 'already_member';
  END IF;

  INSERT INTO public.shop_members (shop_id, user_id, role)
  VALUES (p_shop_id, v_target_id, 'staff');

  -- Give them an active shop if they don't have one
  UPDATE public.profiles
  SET shop_id = p_shop_id
  WHERE id = v_target_id AND shop_id IS NULL;

  RETURN 'added';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- remove_staff_member: owner removes a staff member from the shop
CREATE OR REPLACE FUNCTION public.remove_staff_member(
  p_shop_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid() AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot remove yourself from the shop';
  END IF;

  DELETE FROM public.shop_members
  WHERE shop_id = p_shop_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── D) switch_active_shop ────────────────────────────────────────────────────
-- Updates profiles.shop_id so server-side RLS resolves to the correct shop.

CREATE OR REPLACE FUNCTION public.switch_active_shop(p_shop_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this shop';
  END IF;

  UPDATE public.profiles
  SET shop_id = p_shop_id
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
