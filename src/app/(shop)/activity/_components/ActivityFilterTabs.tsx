"use client";

const FILTER_OPTIONS = [
  { value: "all", label: "All activity" },
  { value: "SALE", label: "Sales" },
  { value: "inventory", label: "Inventory" },
  { value: "STOCK_ADJUST", label: "Stock adjustments" },
  { value: "MEMBER_CHANGE", label: "Team changes" },
] as const;

export type FilterValue = (typeof FILTER_OPTIONS)[number]["value"];

interface ActivityFilterTabsProps {
  filter: FilterValue;
  onChange: (v: FilterValue) => void;
}

export function ActivityFilterTabs({
  filter,
  onChange,
}: ActivityFilterTabsProps) {
  return (
    <div className="flex gap-2 mb-5 flex-wrap">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="btn btn-sm"
          style={{
            background:
              filter === opt.value
                ? "var(--color-brand-500)"
                : "var(--color-surface-0)",
            color:
              filter === opt.value ? "white" : "var(--color-ink-secondary)",
            border: `1px solid ${filter === opt.value ? "var(--color-brand-600)" : "var(--color-border-input)"}`,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
