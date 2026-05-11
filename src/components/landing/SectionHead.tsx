function SectionHead({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ textAlign: "center", marginBottom: 56 }}>
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
          marginBottom: 16,
        }}
      >
        {eyebrow}
      </span>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)",
          lineHeight: 1.15,
          color: "var(--color-ink-primary)",
          marginBottom: subtitle ? 16 : 0,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontSize: "1.0625rem",
            color: "var(--color-ink-secondary)",
            maxWidth: 520,
            margin: "0 auto",
            lineHeight: 1.72,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default SectionHead;
