"use client";

export type Range = "7d" | "30d" | "90d" | "custom";

export const RANGE_LABELS: Record<Range, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  custom: "Custom",
};

export function DateRangeFilter({
  range,
  customFrom,
  customTo,
  onRangeChange,
  onFromChange,
  onToChange,
}: {
  range: Range;
  customFrom: string;
  customTo: string;
  onRangeChange: (r: Range) => void;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {(["7d", "30d", "90d", "custom"] as Range[]).map((r) => (
        <button
          key={r}
          onClick={() => onRangeChange(r)}
          className="btn btn-sm"
          style={{
            background:
              range === r ? "var(--color-brand-500)" : "var(--color-surface-0)",
            color: range === r ? "white" : "var(--color-ink-secondary)",
            border: `1px solid ${range === r ? "var(--color-brand-600)" : "var(--color-border-input)"}`,
          }}
        >
          {RANGE_LABELS[r]}
        </button>
      ))}

      {range === "custom" && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            className="input"
            style={{ width: 150, height: 32, fontSize: 13 }}
            value={customFrom}
            onChange={(e) => onFromChange(e.target.value)}
          />
          <span style={{ color: "var(--color-ink-tertiary)", fontSize: 13 }}>
            to
          </span>
          <input
            type="date"
            className="input"
            style={{ width: 150, height: 32, fontSize: 13 }}
            value={customTo}
            onChange={(e) => onToChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
