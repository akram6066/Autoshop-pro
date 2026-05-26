import Link from "next/link";

const AVATAR_COLORS = [
  "var(--color-brand-500)",
  "var(--color-success)",
  "var(--color-warning)",
  "#8b5cf6",
];

export default function HeroCTARow() {
  return (
    <>
      {/* CTA buttons */}
      <div
        className="h-cta"
        style={{
          display: "flex",
          gap: 14,
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: 28,
        }}
      >
        <Link
          href="/signup"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "15px 34px",
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, #3b6ef5 0%, #8b5cf6 100%)",
            color: "white",
            fontWeight: 700,
            fontSize: "1rem",
            textDecoration: "none",
            boxShadow:
              "0 4px 20px rgba(99,102,241,0.35), 0 1px 4px rgba(59,110,245,0.2)",
            letterSpacing: "0.01em",
          }}
        >
          Start for free
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <a
          href="#how-it-works"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "15px 34px",
            borderRadius: "var(--radius-md)",
            background: "white",
            color: "var(--color-ink-primary)",
            fontWeight: 600,
            fontSize: "1rem",
            textDecoration: "none",
            border: "1.5px solid rgba(99,102,241,0.18)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          See how it works
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>

      {/* Trust row */}
      <div
        className="h-trust"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", marginRight: 4 }}>
          {AVATAR_COLORS.map((bg, i) => (
            <div
              key={i}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: bg,
                border: "2px solid white",
                marginLeft: i === 0 ? 0 : -10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" fill="white" fillOpacity="0.9" />
                <path
                  d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                  fill="white"
                  fillOpacity="0.9"
                />
              </svg>
            </div>
          ))}
        </div>
        <div
          style={{
            width: 1,
            height: 20,
            background: "var(--color-border)",
            margin: "0 4px",
          }}
        />
        <div style={{ display: "flex", gap: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="var(--color-warning)"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
        <span
          style={{
            fontSize: "0.875rem",
            color: "var(--color-ink-secondary)",
            fontWeight: 500,
          }}
        >
          <strong style={{ color: "var(--color-ink-primary)" }}>
            Any shop
          </strong>{" "}
          — any product, any country
        </span>
        <div
          style={{
            width: 1,
            height: 20,
            background: "var(--color-border)",
            margin: "0 4px",
          }}
        />
        <span
          style={{ fontSize: "0.875rem", color: "var(--color-ink-tertiary)" }}
        >
          No credit card required
        </span>
      </div>
    </>
  );
}
