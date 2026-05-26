import Link from "next/link";
import Container from "./Container";

function FinalCTASection() {
  return (
    <section
      style={{
        padding: "100px 0",
        background:
          "linear-gradient(135deg, #3b6ef5 0%, #7c3aed 55%, #8b5cf6 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative glows */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 340,
          height: 340,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.09)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -80,
          left: -60,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.07)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      <Container style={{ position: "relative", textAlign: "center" }}>
        {/* Eyebrow */}
        <span
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.25)",
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            color: "rgba(255,255,255,0.9)",
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
            color: "white",
            maxWidth: 640,
            margin: "0 auto 20px",
          }}
        >
          Ready to take control of your shop?
        </h2>

        <p
          style={{
            fontSize: "1.0625rem",
            color: "rgba(255,255,255,0.75)",
            maxWidth: 460,
            margin: "0 auto 48px",
            lineHeight: 1.75,
          }}
        >
          Join hundreds of shop owners who run smoother, faster businesses with
          AutoShop Pro.
        </p>

        {/* CTA buttons */}
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
              background: "white",
              color: "#3b6ef5",
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
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
            href="https://wa.me/254799964428?text=Hi!%20I%27m%20interested%20in%20AutoShop%20Pro."
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "15px 34px",
              borderRadius: "var(--radius-md)",
              background: "rgba(255,255,255,0.1)",
              border: "1.5px solid rgba(255,255,255,0.35)",
              color: "white",
              fontWeight: 600,
              fontSize: "1rem",
              textDecoration: "none",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Chat on WhatsApp
          </a>
        </div>

        <p
          style={{
            fontSize: "0.8125rem",
            color: "rgba(255,255,255,0.48)",
            marginBottom: 64,
          }}
        >
          No credit card required · Free plan available · Cancel anytime
        </p>

        {/* Stats bar — dark translucent */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-px"
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            maxWidth: 800,
            margin: "0 auto",
          }}
        >
          {[
            { value: "500+", label: "Shops worldwide" },
            { value: "Global", label: "Any country, any currency" },
            { value: "100%", label: "Offline capable" },
            { value: "Free", label: "To start, always" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "rgba(255,255,255,0.07)",
                padding: "20px 24px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontWeight: 800,
                  fontSize: "1.25rem",
                  color: "white",
                  marginBottom: 4,
                }}
              >
                {stat.value}
              </p>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "rgba(255,255,255,0.6)",
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
