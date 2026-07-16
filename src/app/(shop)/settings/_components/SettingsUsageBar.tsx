"use client";

export function SettingsUsageBar({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number;
}) {
  const unlimited = max >= 999999;
  const pct = unlimited ? 0 : Math.min(100, Math.round((current / max) * 100));
  const over = !unlimited && current >= max;
  const warn = !unlimited && pct >= 80;
  const barColor = over
    ? "var(--color-danger)"
    : warn
      ? "var(--color-warning)"
      : "var(--color-brand-500)";

  return (
    <div style={{ marginBottom: 14 }}>
      <div className="flex justify-between mb-1">
        <span
          className="text-xs font-medium"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          {label}
        </span>
        <span
          className="text-xs font-semibold tabular-nums"
          style={{
            color: over ? "var(--color-danger)" : "var(--color-ink-tertiary)",
          }}
        >
          {unlimited ? `${current} / ∞` : `${current} / ${max}`}
        </span>
      </div>
      {!unlimited && (
        <div
          style={{
            height: 5,
            borderRadius: 99,
            background: "var(--color-surface-2)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              borderRadius: 99,
              background: barColor,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      )}
    </div>
  );
}


