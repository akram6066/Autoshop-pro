import Container from "./Container";
import SectionHead from "./SectionHead";

function TestimonialsSection() {
  const quotes = [
    {
      body: "Before AutoShop Pro, I had no idea what stock was left by Friday. Now I check my phone and know exactly what to reorder.",
      name: "Musa A.",
      shop: "Tyre & Battery Shop",
      city: "Nairobi",
      initials: "MA",
      color: "var(--color-brand-500)",
    },
    {
      body: "My staff used to 'borrow' items and I'd only find out months later. Now every movement is tracked and accounted for.",
      name: "Fatuma K.",
      shop: "Auto Parts Store",
      city: "Mombasa",
      initials: "FK",
      color: "var(--color-success)",
    },
    {
      body: "The offline mode saved me during a power cut last month. Customers had no idea anything was wrong.",
      name: "James O.",
      shop: "Rim Centre",
      city: "Kampala",
      initials: "JO",
      color: "var(--color-warning)",
    },
  ];

  return (
    <section
      style={{
        padding: "88px 0",
        background: "linear-gradient(160deg, #eef2ff 0%, #f0e9ff 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: -60,
          right: -60,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "#c4b5fd",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />
      <Container style={{ position: "relative" }}>
        <SectionHead
          eyebrow="Testimonials"
          title="Shops across East Africa trust AutoShop Pro"
          subtitle="Real stories from owners who switched from paper to digital."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {quotes.map((q) => (
            <div
              key={q.name}
              style={{
                padding: "32px 28px",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-surface-0)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-card)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Stars */}
              <div style={{ display: "flex", gap: 3, marginBottom: 20 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="var(--color-warning)"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              {/* Large opening quote */}
              <svg
                width="28"
                height="22"
                fill="none"
                viewBox="0 0 36 28"
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
                    }}
                  >
                    {q.name}
                  </p>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-ink-tertiary)",
                    }}
                  >
                    {q.shop} · {q.city}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default TestimonialsSection;
