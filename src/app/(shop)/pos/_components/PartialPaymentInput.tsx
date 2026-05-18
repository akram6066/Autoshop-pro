import { formatCurrency } from "@/lib/utils";

interface Props {
  amountPaid: number;
  grandTotal: number;
  error: boolean;
  onChange: (v: number) => void;
}

export function PartialPaymentInput({
  amountPaid,
  grandTotal,
  error,
  onChange,
}: Props) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          Amount paid now
        </span>
        <input
          type="number"
          min="1"
          step="50"
          placeholder="0"
          value={amountPaid || ""}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange(isNaN(v) || v < 0 ? 0 : Math.round(v));
          }}
          className="input text-sm text-right"
          style={{
            width: "7rem",
            borderColor: error ? "var(--color-danger)" : undefined,
          }}
        />
      </div>
      {error && (
        <p
          className="text-xs mt-1 text-right"
          style={{ color: "var(--color-danger)" }}
        >
          Enter amount between 1 and {formatCurrency(grandTotal)}
        </p>
      )}
      {amountPaid > 0 && amountPaid < grandTotal && (
        <p
          className="text-xs mt-1 text-right"
          style={{ color: "var(--color-warning)" }}
        >
          Debt: {formatCurrency(grandTotal - amountPaid)}
        </p>
      )}
    </div>
  );
}
