import Container from "@/components/landing/Container";

interface PolicyHeroProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  effectiveDate?: string;
}

export function PolicyHero({
  eyebrow,
  title,
  subtitle,
  effectiveDate,
}: PolicyHeroProps) {
  return (
    <div
      style={{
        background: "linear-gradient(160deg, #eef2ff 0%, #f5f0ff 100%)",
        borderBottom: "1px solid rgba(139,92,246,0.1)",
        padding: "56px 0 48px",
      }}
    >
      <Container>
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-brand-600)",
            marginBottom: 12,
          }}
        >
          {eyebrow}
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            color: "var(--color-ink-primary)",
            marginBottom: subtitle || effectiveDate ? 12 : 0,
            lineHeight: 1.15,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: "1.0625rem",
              color: "var(--color-ink-secondary)",
              maxWidth: 520,
              lineHeight: 1.7,
            }}
          >
            {subtitle}
          </p>
        )}
        {effectiveDate && (
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--color-ink-tertiary)",
            }}
          >
            Effective date: {effectiveDate}
          </p>
        )}
      </Container>
    </div>
  );
}
