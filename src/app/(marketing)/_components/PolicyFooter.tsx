import Link from "next/link";

interface PolicyFooterLink {
  href: string;
  label: string;
}

interface PolicyFooterProps {
  lastUpdated: string;
  links: PolicyFooterLink[];
}

export function PolicyFooter({ lastUpdated, links }: PolicyFooterProps) {
  return (
    <div
      style={{
        marginTop: 48,
        paddingTop: 24,
        borderTop: "1px solid var(--color-border-subtle)",
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--color-ink-ghost)",
          margin: 0,
        }}
      >
        Last updated: {lastUpdated}
      </p>
      <div style={{ display: "flex", gap: 16 }}>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{ fontSize: "0.875rem", color: "var(--color-brand-600)" }}
          >
            {l.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}
