import Container from "./Container";
import SectionHead from "./SectionHead";

const problems = [
  {
    title: "Paper records get lost",
    desc: "Handwritten stock books disappear, get damaged, or become unreadable — leaving you guessing your own inventory.",
    iconBg: "var(--color-danger-light)",
    iconColor: "var(--color-danger)",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8l-6-5z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 3v5h5M10 12h4M10 16h2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Internet cuts out at the worst time",
    desc: "Most shop software stops mid-sale when you lose connection. AutoShop Pro keeps working no matter what.",
    iconBg: "var(--color-warning-light)",
    iconColor: "var(--color-warning)",
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
        <path
          d="M2 21l20-18"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "No visibility into your team",
    desc: "You can't track what staff sold, what discounts were given, or what went missing when you weren't watching.",
    iconBg: "#ede9fe",
    iconColor: "#7c3aed",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M16 11l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function ProblemSection() {
  return (
    <section
      style={{
        padding: "88px 0",
        background:
          "linear-gradient(160deg, #f5f3ff 0%, #ede9fe 50%, #eef2ff 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Soft glow accents */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "#ddd6fe",
          opacity: 0.4,
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -60,
          left: -60,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "#c7d2fe",
          opacity: 0.35,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <Container style={{ position: "relative" }}>
        <SectionHead
          eyebrow="The problem"
          title="Paper and spreadsheets are holding you back"
          subtitle="Every day without the right tools costs you time, money, and peace of mind."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {problems.map((p) => (
            <div
              key={p.title}
              style={{
                padding: "32px 28px",
                borderRadius: "var(--radius-lg)",
                background: "white",
                border: "1px solid rgba(139,92,246,0.12)",
                boxShadow:
                  "0 4px 20px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.04)",
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
                  background: p.iconBg,
                  color: p.iconColor,
                  marginBottom: 20,
                  flexShrink: 0,
                }}
              >
                {p.icon}
              </div>
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: "1.0625rem",
                  color: "var(--color-ink-primary)",
                  marginBottom: 10,
                }}
              >
                {p.title}
              </h3>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--color-ink-secondary)",
                  lineHeight: 1.7,
                }}
              >
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default ProblemSection;
