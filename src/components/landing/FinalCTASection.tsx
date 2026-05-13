import Link from "next/link";
import Container from "./Container";

function FinalCTASection() {
  return (
    <section
      style={{
        padding: "100px 0",
        background: "var(--color-surface-1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Same decorative blob style as FeaturesSection / TestimonialsSection */}
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
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "var(--color-brand-100)",
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -80,
          left: -60,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "var(--color-brand-100)",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />

      <Container style={{ position: "relative", textAlign: "center" }}>
        {/* Eyebrow — identical pattern to SectionHead */}
        <span
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: 999,
            background: "var(--color-brand-50)",
            border: "1px solid var(--color-brand-100)",
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            color: "var(--color-brand-600)",
            marginBottom: 20,
          }}
        >
          Get started today
        </span>

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
            lineHeight: 1.1,
            color: "var(--color-ink-primary)",
            maxWidth: 640,
            margin: "0 auto 20px",
          }}
        >
          Ready to take control of your shop?
        </h2>

        <p
          style={{
            fontSize: "1.0625rem",
            color: "var(--color-ink-secondary)",
            maxWidth: 460,
            margin: "0 auto 48px",
            lineHeight: 1.75,
          }}
        >
          Join hundreds of shop owners who run smoother, faster businesses with
          AutoShop Pro.
        </p>

        {/* CTA buttons — same style as HeroSection */}
        <div
          style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: 20,
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
              background: "var(--color-brand-500)",
              color: "white",
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(59,110,245,0.3)",
            }}
          >
            Get Started Free
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
            href="#waitlist"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "15px 34px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface-0)",
              border: "1.5px solid var(--color-border)",
              color: "var(--color-ink-primary)",
              fontWeight: 600,
              fontSize: "1rem",
              textDecoration: "none",
              boxShadow: "var(--shadow-card)",
            }}
          >
            Join waitlist
          </a>
        </div>

        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-ink-ghost)",
            marginBottom: 64,
          }}
        >
          No credit card required · Free plan available · Cancel anytime
        </p>

        {/* Stats bar — same pattern as HeroSection stats bar */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-px"
          style={{
            background: "var(--color-border)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            maxWidth: 800,
            margin: "0 auto",
          }}
        >
          {[
            { value: "50+", label: "Active shops" },
            { value: "3 cities", label: "Nairobi · Mombasa · Kampala" },
            { value: "100%", label: "Offline capable" },
            { value: "Free", label: "To start, always" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "var(--color-surface-0)",
                padding: "20px 24px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontWeight: 800,
                  fontSize: "1.25rem",
                  color: "var(--color-brand-600)",
                  marginBottom: 4,
                }}
              >
                {stat.value}
              </p>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-ink-tertiary)",
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default FinalCTASection;
