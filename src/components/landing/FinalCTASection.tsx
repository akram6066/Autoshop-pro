import Link from "next/link";
import Container from "./Container";

function FinalCTASection() {
  return (
    <section
      style={{
        padding: "48px 0",
        background:
          "linear-gradient(135deg, #1d4ed8 0%, #3b6ef5 45%, #6d28d9 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative glows */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: -80,
          left: -60,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <Container style={{ position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          {/* Text */}
          <div style={{ flex: "1 1 260px", minWidth: 0 }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.25rem, 2.4vw, 1.75rem)",
                lineHeight: 1.2,
                letterSpacing: "-0.015em",
                margin: "0 0 6px",
                fontWeight: 700,
              }}
            >
              <span style={{ color: "white" }}>Run smarter. </span>
              <span
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontStyle: "italic",
                }}
              >
                Sell faster.
              </span>
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "rgba(255,255,255,0.58)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Set up in minutes · works offline · any device
            </p>
          </div>

          {/* CTA */}
          <Link
            href="/signup"
            className="final-cta-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "13px 28px",
              borderRadius: "var(--radius-md)",
              background: "white",
              color: "#3b6ef5",
              fontWeight: 700,
              fontSize: "0.9375rem",
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.16)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Create Your Free Account
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </Container>
    </section>
  );
}

export default FinalCTASection;
