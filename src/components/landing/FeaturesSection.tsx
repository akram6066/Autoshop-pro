import Container from "./Container";
import { RevealOnScroll } from "./RevealOnScroll";

const features = [
  {
    title: "Lightning-fast POS",
    desc: "Complete a sale in seconds. Accept cash, M-Pesa, card, or credit — and share receipts instantly.",
    iconBg: "rgba(59,110,245,0.1)",
    iconColor: "#3b6ef5",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect
          x="2"
          y="5"
          width="20"
          height="15"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M2 10h20M6 15h4M14 15h4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Smart Inventory",
    desc: "Track stock by room or shelf. Set reorder alerts and never run out of your fastest-moving items.",
    iconBg: "rgba(5,150,105,0.1)",
    iconColor: "#059669",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m8 4v10"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Multi-branch ready",
    desc: "Manage all your shops from one account. Switch between branches instantly from the nav bar.",
    iconBg: "rgba(124,58,237,0.1)",
    iconColor: "#7c3aed",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
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
        />
      </svg>
    ),
  },
  {
    title: "Sales Reports",
    desc: "Daily and weekly revenue, top-selling products, and low-stock alerts — all in one clear view.",
    iconBg: "rgba(217,119,6,0.1)",
    iconColor: "#d97706",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M18 20V10M12 20V4M6 20v-6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Customer Debt Tracking",
    desc: "Record credit sales and track outstanding balances per customer. No more forgotten tabs.",
    iconBg: "rgba(225,29,72,0.1)",
    iconColor: "#e11d48",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect
          x="2"
          y="5"
          width="20"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M2 10h20M6 15h4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Works Offline",
    desc: "Built as a PWA. Every sale and stock change saves locally and syncs automatically when you reconnect.",
    iconBg: "rgba(8,145,178,0.1)",
    iconColor: "#0891b2",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M1 6s2-2 11-2 11 2 11 2M5 12s1.5-2 7-2 7 2 7 2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle
          cx="12"
          cy="18"
          r="2"
          stroke="currentColor"
          strokeWidth="1.75"
        />
      </svg>
    ),
  },
];

function FeaturesSection() {
  return (
    <section
      id="features"
      style={{
        padding: "96px 0",
        background: "var(--color-surface-1)",
        borderTop: "1px solid var(--color-border-subtle)",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <Container>
        {/* Section head */}
        <RevealOnScroll>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <span
              style={{
                display: "inline-block",
                padding: "4px 14px",
                borderRadius: 999,
                background: "rgba(59,110,245,0.08)",
                border: "1px solid rgba(59,110,245,0.18)",
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--color-brand-600)",
                marginBottom: 16,
              }}
            >
              Features
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)",
                lineHeight: 1.15,
                color: "var(--color-ink-primary)",
                marginBottom: 16,
              }}
            >
              Everything your shop needs
            </h2>
            <p
              style={{
                fontSize: "1.0625rem",
                color: "var(--color-ink-secondary)",
                maxWidth: 520,
                margin: "0 auto",
                lineHeight: 1.72,
              }}
            >
              One tool for POS, inventory, staff, and reporting — with offline
              support built in from day one.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <RevealOnScroll key={f.title} delay={i * 75}>
              <div
                className="feature-card"
                style={{
                  padding: "28px 24px",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--color-surface-0)",
                  border: "1px solid var(--color-border)",
                  borderTop: "3px solid transparent",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: f.iconBg,
                    color: f.iconColor,
                    marginBottom: 18,
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1.0625rem",
                    color: "var(--color-ink-primary)",
                    marginBottom: 8,
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--color-ink-secondary)",
                    lineHeight: 1.7,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default FeaturesSection;
