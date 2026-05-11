import Container from "./Container";
import SectionHead from "./SectionHead";

const features = [
  {
    title: "Lightning-fast POS",
    desc: "Complete a sale in seconds. Accept cash, M-Pesa, card, or credit — and share receipts instantly.",
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
        padding: "88px 0",
        background: "var(--color-surface-1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "var(--color-brand-50)",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />
      <Container style={{ position: "relative" }}>
        <SectionHead
          eyebrow="Features"
          title="Everything your shop needs"
          subtitle="One tool for POS, inventory, staff, and reporting — with offline support built in from day one."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                padding: "28px 24px",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-surface-0)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-card)",
                display: "flex",
                flexDirection: "column",
                gap: 0,
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
                  background: "var(--color-brand-500)",
                  color: "white",
                  marginBottom: 18,
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: "1rem",
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
          ))}
        </div>
      </Container>
    </section>
  );
}

export default FeaturesSection;
