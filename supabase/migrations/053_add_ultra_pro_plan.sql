insert into public.subscription_plans (
  name, display_name, price_kes, annual_discount_pct,
  trial_days, max_shops, max_products_per_shop,
  max_staff_per_shop, max_sales_per_month
) values (
  'ultra_pro', 'Ultra Pro', 2500, 20,
  0, 10, 2000, 20, 999999
)
on conflict (name) do nothing;
