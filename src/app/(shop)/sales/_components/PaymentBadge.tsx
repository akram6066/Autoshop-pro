import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/types/app";

const COLORS: Record<PaymentMethod, { bg: string; color: string }> = {
  cash: { bg: "var(--color-success-light)", color: "var(--color-success)" },
  mpesa: { bg: "var(--color-brand-50)", color: "var(--color-brand-600)" },
  credit: { bg: "var(--color-warning-light)", color: "var(--color-warning)" },
  partial: {
    bg: "var(--color-surface-2)",
    color: "var(--color-ink-secondary)",
  },
};

export function PaymentBadge({ method }: { method: PaymentMethod }) {
  const { bg, color } = COLORS[method] ?? COLORS.cash;
  return (
    <span className="badge" style={{ background: bg, color }}>
      {PAYMENT_METHOD_LABELS[method]}
    </span>
  );
}


