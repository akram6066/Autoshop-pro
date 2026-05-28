import Container from "./Container";
import { RevealOnScroll } from "./RevealOnScroll";

const BLUE = "#3b6ef5";
const BLUE_BG = "rgba(59,110,245,0.08)";
const BLUE_BORDER = "rgba(59,110,245,0.18)";
// icon container still uses BLUE/BLUE_BG/BLUE_BORDER

const stats = [
  {
    value: "500+",
    label: "Shops worldwide",
    sub: "and growing every day",
    icon: (
      <svg
        width="22"
        height="22"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M2 7h20v2a5 5 0 01-10 0A5 5 0 012 9V7z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 14v7h16v-7"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 7l2-4h16l2 4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 21v-5h6v5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    value: "50+",
    label: "Countries served",
    sub: "any currency, any language",
    icon: (
      <svg
        width="22"
        height="22"
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
          d="M2 12h20"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M12 2c-2.5 3.5-4 6.5-4 10s1.5 6.5 4 10M12 2c2.5 3.5 4 6.5 4 10s-1.5 6.5-4 10"
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
    icon: (
      <svg
        width="22"
        height="22"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    value: "30-day",
    label: "Free trial",
    sub: "no credit card needed",
    icon: (
      <svg
        width="22"
        height="22"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="4"
          width="18"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M16 2v4M8 2v4M3 10h18"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function StatsSection() {
  return (
    <section
      style={{
        padding: "80px 0",
        background: "var(--color-surface-0)",
        borderTop: "1px solid var(--color-border-subtle)",
        borderBottom: "1px solid var(--color-border-subtle)",
        position: "relative",
        overflow: "hidden",
      }}
    >
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {stats.map((s, i) => (
            <RevealOnScroll key={s.value} delay={i * 80}>
              <div
                className="stat-card"
                style={{
                  position: "relative",
                  borderRadius: "var(--radius-lg)",
                  padding: "24px 20px",
                  background: "var(--color-surface-0)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  overflow: "hidden",
                }}
              >
                {/* Icon — circular */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: BLUE_BG,
                    border: `1px solid ${BLUE_BORDER}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: BLUE,
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>

                {/* Number + labels */}
                <div>
                  <p
                    style={{
                      fontSize: "clamp(1.625rem, 4vw, 2.125rem)",
                      fontWeight: 800,
                      color: "var(--color-ink-primary)",
                      lineHeight: 1,
                      marginBottom: 5,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {s.value}
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--color-ink-primary)",
                      marginBottom: 2,
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
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  );
}
