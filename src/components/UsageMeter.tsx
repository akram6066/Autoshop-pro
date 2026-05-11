interface Props {
  label: string;
  current: number;
  max: number;
  unit?: string;
}

export function UsageMeter({ label, current, max, unit }: Props) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const barColor =
    pct >= 95
      ? "var(--color-danger)"
      : pct >= 80
        ? "var(--color-warning)"
        : "var(--color-brand-500)";

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 13, color: "var(--color-ink-secondary)" }}>
          {label}
        </span>
        <span style={{ fontSize: 13, color: "var(--color-ink-tertiary)" }}>
          {current} / {max}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "var(--color-surface-3)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 3,
            background: barColor,
            transition: "width 0.3s, background 0.3s",
          }}
        />
      </div>
    </div>
  );
}
