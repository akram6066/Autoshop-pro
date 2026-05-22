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
            padding: "6px 18px",
            borderRadius: 999,
            background: "white",
            border: "1px solid rgba(99,102,241,0.2)",
            boxShadow: "0 1px 8px rgba(99,102,241,0.1)",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "var(--color-brand-700)",
            letterSpacing: "0.03em",
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
            }}
          />
          Now live · Free plan available
        </span>
      </div>

      {/* Headline with typing animation */}
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.75rem, 6vw, 4.5rem)",
          lineHeight: 1.06,
          maxWidth: 820,
          margin: "0 auto 28px",
          letterSpacing: "-0.02em",
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
            minHeight: "1.15em",
          }}
        >
          <span
            style={{
              background: "linear-gradient(135deg, #3b6ef5 0%, #8b5cf6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {typedText}
          </span>
          <span className="h-cursor" aria-hidden="true" />
        </span>
        <span
          className="h-line3"
          style={{ display: "block", color: "var(--color-ink-primary)" }}
        >
          like a modern business.
        </span>
      </h1>

      {/* Subheadline */}
      <p
        className="h-sub"
        style={{
          fontSize: "1.1875rem",
          color: "var(--color-ink-secondary)",
          maxWidth: 520,
          margin: "0 auto 32px",
          lineHeight: 1.78,
        }}
      >
        Inventory, POS, staff management and reports — all in one place, even
        when the internet goes out.
      </p>
    </>
  );
}
