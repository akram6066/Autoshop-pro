import Container from "./Container";
import { RevealOnScroll } from "./RevealOnScroll";

const stats = [
  {
    value: "500+",
    label: "Shops worldwide",
    sub: "and growing every day",
    color: "#3b6ef5",
    bg: "rgba(59,110,245,0.08)",
    border: "rgba(59,110,245,0.2)",
    glow: "rgba(59,110,245,0.15)",
    icon: (
      <svg
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 22V12h6v10"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    value: "Global",
    label: "Any country, any currency",
    sub: "works wherever you are",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.2)",
    glow: "rgba(124,58,237,0.15)",
    icon: (
      <svg
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    value: "100%",
    label: "Offline capable",
    sub: "sell with zero internet",
    color: "#059669",
    bg: "rgba(5,150,105,0.08)",
    border: "rgba(5,150,105,0.2)",
    glow: "rgba(5,150,105,0.15)",
    icon: (
      <svg
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    value: "Free",
    label: "To start, always",
    sub: "30-day trial, no card needed",
    color: "#d97706",
    bg: "rgba(217,119,6,0.08)",
    border: "rgba(217,119,6,0.2)",
    glow: "rgba(217,119,6,0.15)",
    icon: (
      <svg
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function StatsSection() {
  return (
    <section
      style={{
        padding: "72px 0",
        background:
          "linear-gradient(180deg, var(--color-surface-0) 0%, var(--color-surface-1) 100%)",
        borderTop: "1px solid var(--color-border-subtle)",
        borderBottom: "1px solid var(--color-border-subtle)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle background dot grid */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(99,102,241,0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
        }}
      />

      <Container style={{ position: "relative" }}>
        {/* Eyebrow */}
        <RevealOnScroll>
          <p
            style={{
              textAlign: "center",
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-brand-600)",
              marginBottom: 40,
            }}
          >
            Trusted by shop owners globally
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s, i) => (
            <RevealOnScroll key={s.value} delay={i * 80}>
              <div
                style={{
                  position: "relative",
                  borderRadius: "var(--radius-lg)",
                  padding: "28px 24px",
                  background: "var(--color-surface-0)",
                  border: `1px solid ${s.border}`,
                  boxShadow: `0 4px 24px ${s.glow}, 0 1px 4px rgba(0,0,0,0.04)`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  overflow: "hidden",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                className="stat-card"
              >
                {/* Corner glow accent */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: -30,
                    right: -30,
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: s.bg,
                    filter: "blur(24px)",
                    pointerEvents: "none",
                  }}
                />

                {/* Icon */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "var(--radius-md)",
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: s.color,
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>

                {/* Number */}
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
                      fontWeight: 800,
                      color: s.color,
                      lineHeight: 1,
                      marginBottom: 6,
                    }}
                  >
                    {s.value}
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--color-ink-primary)",
                      marginBottom: 3,
                      lineHeight: 1.3,
                    }}
                  >
                    {s.label}
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-ink-tertiary)",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {s.sub}
                  </p>
                </div>

                {/* Bottom accent bar */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${s.color}44 0%, ${s.color} 50%, ${s.color}44 100%)`,
                    borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
                  }}
                />
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  );
}
