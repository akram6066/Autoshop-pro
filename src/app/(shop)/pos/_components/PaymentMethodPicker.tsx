"use client";

import type { PaymentMethod } from "@/types/app";
import { PAYMENT_METHOD_LABELS } from "@/types/app";

interface Props {
  value: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
}

export function PaymentMethodPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3">
      {(["cash", "mpesa", "credit", "partial"] as PaymentMethod[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className="py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{
            background:
              value === m ? "var(--color-brand-500)" : "var(--color-surface-2)",
            color: value === m ? "white" : "var(--color-ink-secondary)",
            border: `1px solid ${value === m ? "var(--color-brand-600)" : "var(--color-border-input)"}`,
          }}
        >
          {PAYMENT_METHOD_LABELS[m]}
        </button>
      ))}
    </div>
  );
}


