export default function HeroHeadline({ typedText }: { typedText: string }) {
  return (
    <>
      {/* Pill badge */}
      <div className="h-badge" style={{ marginBottom: 28 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 20px",
            borderRadius: 999,
            background: "white",
            border: "1px solid rgba(99,102,241,0.22)",
            boxShadow:
              "0 1px 12px rgba(99,102,241,0.14), 0 1px 3px rgba(0,0,0,0.04)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--color-brand-700)",
            letterSpacing: "0.01em",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--color-success)",
              display: "inline-block",
              boxShadow: "0 0 0 3px var(--color-success-light)",
              flexShrink: 0,
            }}
          />
          Now live · Free plan available
        </span>
      </div>

      {/* Headline */}
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.75rem, 7vw, 5rem)",
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          margin: "0 auto 20px",
          maxWidth: 800,
        }}
      >
        <span
          className="h-line1"
          style={{ display: "block", color: "var(--color-ink-primary)" }}
        >
          Run your
        </span>
        <span
          className="h-line2"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "1.1em",
          }}
        >
          <span
            aria-live="polite"
            aria-atomic="true"
            style={{
              background:
                "linear-gradient(135deg, #1e40af 0%, #3b6ef5 50%, #7c3aed 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {typedText}
          </span>
          <span className="h-cursor" aria-hidden="true" />
        </span>
      </h1>

      {/* Subheadline */}
      <p
        className="h-sub"
        style={{
          fontSize: "1.0625rem",
          color: "var(--color-ink-secondary)",
          maxWidth: 480,
          margin: "0 auto 36px",
          lineHeight: 1.75,
        }}
      >
        Inventory, POS, staff &amp; reports — all in one place, works even when
        the internet goes out.
      </p>
    </>
  );
}
