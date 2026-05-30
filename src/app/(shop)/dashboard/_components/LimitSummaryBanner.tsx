import {
  LimitWarningBanner,
  type LimitItem,
} from "@/components/shop/LimitWarningBanner";

interface Props {
  products: { current: number; max: number };
  sales: { current: number; max: number };
  staff: { current: number; max: number };
}

export function LimitSummaryBanner({ products, sales, staff }: Props) {
  const items: LimitItem[] = [
    { label: "products", current: products.current, max: products.max },
    { label: "sales this month", current: sales.current, max: sales.max },
    { label: "staff", current: staff.current, max: staff.max },
  ];

  return <LimitWarningBanner items={items} upgradeHref="/billing?plan=pro" />;
}
