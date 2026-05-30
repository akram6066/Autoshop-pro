const STATUS_META: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  trial: { label: "Trial", bg: "#fef9c3", color: "#a16207" },
  active: { label: "Active", bg: "#dcfce7", color: "#15803d" },
  free: { label: "Free", bg: "#dbeafe", color: "#1d4ed8" },
  expired: { label: "Expired", bg: "#fee2e2", color: "#dc2626" },
  cancelled: { label: "Cancelled", bg: "#f1f5f9", color: "#64748b" },
};

export function SubStatusBadges({
  counts,
}: {
  counts: Record<string, number>;
}) {
  return (
    <div
      style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}
    >
      {Object.entries(STATUS_META).map(([key, meta]) => (
        <div
          key={key}
          style={{
            background: meta.bg,
            borderRadius: 10,
            padding: "12px 20px",
            minWidth: 100,
          }}
        >
          <p style={{ fontSize: "1.5rem", fontWeight: 800, color: meta.color }}>
            {counts[key] ?? 0}
          </p>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: meta.color,
              opacity: 0.8,
            }}
          >
            {meta.label}
          </p>
        </div>
      ))}
    </div>
  );
}
