import Link from "next/link";

export interface StatCard {
  label: string;
  value: number;
  color: string;
  bg: string;
  icon: React.ReactElement;
  sub: string;
  href?: string;
}

export function AdminStatGrid({ cards }: { cards: StatCard[] }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5"
      style={{ marginBottom: 40 }}
    >
      {cards.map((c) => {
        const inner = (
          <>
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
          </>
        );

        const cardStyle: React.CSSProperties = {
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "20px 22px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          display: "block",
          textDecoration: "none",
          transition: "box-shadow 0.15s",
        };

        return c.href ? (
          <Link key={c.label} href={c.href} style={cardStyle}>
            {inner}
          </Link>
        ) : (
          <div key={c.label} style={cardStyle}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
