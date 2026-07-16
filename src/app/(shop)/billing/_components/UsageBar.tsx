export function UsageBar({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number;
}) {
  const pct =
    max >= 999999 ? 0 : Math.min(100, Math.round((current / max) * 100));
  const over = current >= max;
  const warn = pct >= 80;
  const color = over
    ? "var(--color-danger)"
    : warn
      ? "var(--color-warning)"
      : "var(--color-brand-500)";

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: "0.875rem",
            color: "var(--color-ink-secondary)",
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: over ? "var(--color-danger)" : "var(--color-ink-tertiary)",
          }}
        >
          {max >= 999999 ? `${current} / ∞` : `${current} / ${max}`}
        </span>
      </div>
      {max < 999999 && (
        <div
          style={{
            height: 6,
            borderRadius: 99,
            background: "var(--color-surface-3)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              borderRadius: 99,
              background: color,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      )}
    </div>
  );
}


