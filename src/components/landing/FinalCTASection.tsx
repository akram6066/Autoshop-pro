import Link from "next/link";
import Container from "./Container";

function FinalCTASection() {
  return (
    <section
      style={{
        padding: "100px 0",
        background: "var(--color-brand-600)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: "white",
          opacity: 0.05,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: -60,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "white",
          opacity: 0.05,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "white",
          opacity: 0.03,
          pointerEvents: "none",
        }}
      />

      <Container style={{ position: "relative", textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            color: "rgba(255,255,255,0.9)",
            marginBottom: 24,
          }}
        >
          Get started today
        </span>

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
            color: "white",
            lineHeight: 1.1,
            maxWidth: 640,
            margin: "0 auto 20px",
          }}
        >
          Ready to take control of your shop?
        </h2>
        <p
          style={{
            fontSize: "1.125rem",
            color: "rgba(255,255,255,0.75)",
            maxWidth: 460,
            margin: "0 auto 40px",
            lineHeight: 1.72,
          }}
        >
          Join hundreds of shop owners who run smoother, faster businesses with
          AutoShop Pro.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
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
              gap: 8,
              padding: "14px 36px",
              borderRadius: "var(--radius-md)",
              background: "white",
              color: "var(--color-brand-600)",
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
            }}
          >
            Get Started Free
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
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
              padding: "14px 36px",
              borderRadius: "var(--radius-md)",
              background: "transparent",
              border: "1.5px solid rgba(255,255,255,0.4)",
              color: "white",
              fontWeight: 600,
              fontSize: "1rem",
              textDecoration: "none",
            }}
          >
            Join waitlist
          </a>
        </div>

        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)" }}>
          No credit card required · Free plan available · Cancel anytime
        </p>
      </Container>
    </section>
  );
}

export default FinalCTASection;
