interface Props {
  enabled: boolean;
  address: string;
  fee: number;
  addressError: boolean;
  onToggle: () => void;
  onAddressChange: (v: string) => void;
  onFeeChange: (v: number) => void;
}

export function DeliverySection({
  enabled,
  address,
  fee,
  addressError,
  onToggle,
  onAddressChange,
  onFeeChange,
}: Props) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between">
        <span
          className="text-sm"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          Delivery
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={onToggle}
          className="relative inline-flex h-5 w-10 items-center rounded-full transition-colors"
          style={{
            background: enabled
              ? "var(--color-brand-500)"
              : "var(--color-surface-2)",
            border: `1px solid ${enabled ? "var(--color-brand-600)" : "var(--color-border-input)"}`,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <span
            className="inline-block h-4 w-4 rounded-full transition-transform"
            style={{
              background: "white",
              transform: enabled ? "translateX(22px)" : "translateX(2px)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
            }}
          />
        </button>
      </div>

      {enabled && (
        <div className="mt-2 flex flex-col gap-2">
          <div>
            <input
              type="text"
              placeholder="Delivery address"
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
              className="input w-full text-sm"
              style={
                addressError
                  ? { borderColor: "var(--color-danger)" }
                  : undefined
              }
            />
            {addressError && (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-danger)" }}
              >
                Address is required for delivery
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-xs"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Delivery fee
            </span>
            <input
              type="number"
              min="0"
              step="50"
              placeholder="0"
              value={fee || ""}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                onFeeChange(isNaN(v) || v < 0 ? 0 : Math.round(v));
              }}
              className="input text-sm text-right"
              style={{ width: "7rem" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}


