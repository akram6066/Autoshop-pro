import Container from "./Container";
import SectionHead from "./SectionHead";

const problems = [
  {
    title: "Paper records get lost",
    desc: "Handwritten stock books disappear, get damaged, or become unreadable — leaving you guessing your own inventory.",
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
      style={{ padding: "88px 0", background: "var(--color-surface-0)" }}
    >
      <Container>
        <SectionHead
          eyebrow="The problem"
          title="Paper and spreadsheets are holding you back"
          subtitle="Every day without the right tools costs you time, money, and peace of mind."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <div
              key={p.title}
              style={{
                padding: "32px 28px",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-surface-1)",
                border: "1px solid var(--color-border)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Subtle corner accent */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 80,
                  height: 80,
                  background:
                    i === 0
                      ? "var(--color-danger)"
                      : i === 1
                        ? "var(--color-warning)"
                        : "var(--color-brand-500)",
                  opacity: 0.06,
                  borderBottomLeftRadius: "100%",
                }}
              />
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    i === 0
                      ? "color-mix(in srgb, var(--color-danger) 12%, transparent)"
                      : i === 1
                        ? "color-mix(in srgb, var(--color-warning) 12%, transparent)"
                        : "var(--color-brand-50)",
                  color:
                    i === 0
                      ? "var(--color-danger)"
                      : i === 1
                        ? "var(--color-warning)"
                        : "var(--color-brand-600)",
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
