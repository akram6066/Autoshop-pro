export function FloatingRevenueCard() {
  return (
    <div
      className="h-card1 hidden sm:block"
      style={{ position: "absolute", top: 40, left: -20, zIndex: 10 }}
    >
      <div
        className="h-float1"
        style={{
          background: "white",
          borderRadius: "var(--radius-lg)",
          padding: "14px 18px",
          boxShadow:
            "0 8px 32px rgba(99,102,241,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          border: "1px solid rgba(99,102,241,0.1)",
          minWidth: 160,
        }}
      >
        <p
          style={{
            fontSize: "0.6875rem",
            color: "var(--color-ink-tertiary)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}
        >
          Today&apos;s Revenue
        </p>
        <p
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--color-ink-primary)",
            lineHeight: 1,
            marginBottom: 4,
          }}
        >
          KSh 84,200
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--color-success)",
              background: "var(--color-success-light)",
              padding: "2px 8px",
              borderRadius: 999,
            }}
          >
            <svg width="10" height="10" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 19V5M5 12l7-7 7 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            +18%
          </span>
          <span
            style={{ fontSize: "0.75rem", color: "var(--color-ink-tertiary)" }}
          >
            vs yesterday
          </span>
        </div>
      </div>
    </div>
  );
}

export function FloatingStockCard() {
  return (
    <div
      className="h-card2 hidden sm:block"
      style={{ position: "absolute", top: 40, right: -20, zIndex: 10 }}
    >
      <div
        className="h-float2"
        style={{
          background: "white",
          borderRadius: "var(--radius-lg)",
          padding: "14px 18px",
          boxShadow:
            "0 8px 32px rgba(99,102,241,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          border: "1px solid rgba(99,102,241,0.1)",
          minWidth: 150,
        }}
      >
        <p
          style={{
            fontSize: "0.6875rem",
            color: "var(--color-ink-tertiary)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}
        >
          Stock Alert
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              background: "var(--color-warning-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 9v4M12 17h.01"
                stroke="var(--color-warning)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="var(--color-warning)"
                strokeWidth="1.75"
              />
            </svg>
          </div>
          <div>
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "var(--color-ink-primary)",
              }}
            >
              3 items low
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-ink-tertiary)",
              }}
            >
              Reorder needed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FloatingSaleCard() {
  return (
    <div
      className="h-card3 hidden lg:block"
      style={{ position: "absolute", bottom: 40, left: -16, zIndex: 10 }}
    >
      <div
        className="h-float3"
        style={{
          background: "white",
          borderRadius: "var(--radius-lg)",
          padding: "12px 16px",
          boxShadow:
            "0 8px 32px rgba(99,102,241,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          border: "1px solid rgba(99,102,241,0.1)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--color-success-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path
              d="M20 6L9 17l-5-5"
              stroke="var(--color-success)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <p
            style={{
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "var(--color-ink-primary)",
            }}
          >
            Sale recorded
          </p>
          <p
            style={{ fontSize: "0.75rem", color: "var(--color-ink-tertiary)" }}
          >
            Offline — syncing…
          </p>
        </div>
      </div>
    </div>
  );
}
