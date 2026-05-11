ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'pro'));

CREATE OR REPLACE FUNCTION public.check_product_limit()
RETURNS trigger AS $$
DECLARE v_count int; v_plan text;
BEGIN
  SELECT plan INTO v_plan FROM public.shops WHERE id = NEW.shop_id;
  SELECT COUNT(*) INTO v_count FROM public.products WHERE shop_id = NEW.shop_id;
  IF v_plan = 'free' AND v_count >= 500 THEN
    RAISE EXCEPTION 'product limit reached for free plan';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_product_limit ON public.products;
CREATE TRIGGER trg_check_product_limit
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.check_product_limit();

CREATE OR REPLACE FUNCTION public.check_room_limit()
RETURNS trigger AS $$
DECLARE v_count int; v_plan text;
BEGIN
  SELECT plan INTO v_plan FROM public.shops WHERE id = NEW.shop_id;
  SELECT COUNT(*) INTO v_count FROM public.rooms WHERE shop_id = NEW.shop_id;
  IF v_plan = 'free' AND v_count >= 5 THEN
    RAISE EXCEPTION 'room limit reached for free plan';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_room_limit ON public.rooms;
CREATE TRIGGER trg_check_room_limit
  BEFORE INSERT ON public.rooms
  FOR EACH ROW EXECUTE PROCEDURE public.check_room_limit();

CREATE OR REPLACE FUNCTION public.check_category_limit()
RETURNS trigger AS $$
DECLARE v_count int; v_plan text;
BEGIN
  SELECT plan INTO v_plan FROM public.shops WHERE id = NEW.shop_id;
  SELECT COUNT(*) INTO v_count FROM public.categories WHERE shop_id = NEW.shop_id;
  IF v_plan = 'free' AND v_count >= 10 THEN
    RAISE EXCEPTION 'category limit reached for free plan';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_category_limit ON public.categories;
CREATE TRIGGER trg_check_category_limit
  BEFORE INSERT ON public.categories
  FOR EACH ROW EXECUTE PROCEDURE public.check_category_limit();
