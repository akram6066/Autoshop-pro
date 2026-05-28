import Container from "./Container";
import SectionHead from "./SectionHead";
import { RevealOnScroll } from "./RevealOnScroll";

const quotes = [
  {
    body: "Before this, I had no idea what stock was left by Friday. Now I check my phone and know exactly what to reorder — even when the internet is down.",
    name: "Amina K.",
    shop: "Clothing & Accessories",
    city: "Nairobi",
    initials: "AK",
    color: "var(--color-brand-500)",
    stars: 5,
  },
  {
    body: "My staff used to 'borrow' items and I'd only find out months later. Now every movement is tracked and I get alerts the moment stock runs low.",
    name: "James O.",
    shop: "Electronics Shop",
    city: "Kampala",
    initials: "JO",
    color: "var(--color-success)",
    stars: 5,
  },
  {
    body: "The offline mode saved me during a blackout last month. Customers had no idea anything was wrong — sales kept going. Setup took under an hour.",
    name: "Fatuma M.",
    shop: "Hardware Store",
    city: "Mombasa",
    initials: "FM",
    color: "#6d28d9",
    stars: 4,
  },
];

function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      style={{
        padding: "96px 0",
        background: "linear-gradient(160deg, #eef2ff 0%, #f0e9ff 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: -60,
          right: -60,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "#c4b5fd",
          opacity: 0.3,
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />

      <Container style={{ position: "relative" }}>
        <RevealOnScroll>
          <SectionHead
            eyebrow="Testimonials"
            title="Shop owners love running their business smarter"
            subtitle="Real stories from owners who switched from paper and spreadsheets to AutoShop Pro."
          />
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quotes.map((q, i) => (
            <RevealOnScroll key={q.name} delay={i * 90}>
              <div
                className="card-hover"
                style={{
                  padding: "32px 28px",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--color-surface-0)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-card)",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                {/* Stars */}
                <div style={{ display: "flex", gap: 3, marginBottom: 20 }}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <svg
                      key={idx}
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill={idx < q.stars ? "var(--color-warning)" : "none"}
                      stroke={idx < q.stars ? "none" : "var(--color-ink-ghost)"}
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>

                {/* Opening quote mark */}
                <svg
                  width="28"
                  height="22"
                  fill="none"
                  viewBox="0 0 36 28"
                  aria-hidden="true"
                  style={{ marginBottom: 12, flexShrink: 0 }}
                >
                  <path
                    d="M0 28V17.5C0 7.5 6 2 18 0l2 3.5C13 5.5 10 9 10 14h6V28H0zm18 0V17.5C18 7.5 24 2 36 0l2 3.5C31 5.5 28 9 28 14h6V28H18z"
                    fill="var(--color-brand-100)"
                  />
                </svg>

                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--color-ink-secondary)",
                    lineHeight: 1.75,
                    flexGrow: 1,
                    marginBottom: 24,
                    fontStyle: "italic",
                  }}
                >
                  {q.body}
                </p>

                {/* Author */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: q.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "white",
                      }}
                    >
                      {q.initials}
                    </span>
                  </div>
                  <div>
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        color: "var(--color-ink-primary)",
                        marginBottom: 2,
                      }}
                    >
                      {q.name}
                    </p>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-ink-tertiary)",
                        marginBottom: 3,
                      }}
                    >
                      {q.shop} · {q.city}
                    </p>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        color: "var(--color-success-text)",
                        background: "var(--color-success-light)",
                        padding: "2px 8px",
                        borderRadius: 999,
                      }}
                    >
                      <svg
                        width="9"
                        height="9"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Verified customer
                    </span>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default TestimonialsSection;
