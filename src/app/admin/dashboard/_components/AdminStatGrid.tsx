interface StatCard {
  label: string;
  value: number;
  color: string;
  bg: string;
  icon: React.ReactElement;
  sub: string;
}

export function AdminStatGrid({ cards }: { cards: StatCard[] }) {
  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-5"
      style={{ marginBottom: 40 }}
    >
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "20px 22px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: c.bg,
              color: c.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            {c.icon}
          </div>
          <p
            style={{
              fontSize: "1.875rem",
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            {c.value}
          </p>
          <p
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "#334155",
              marginBottom: 2,
            }}
          >
            {c.label}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
