export function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2
        style={{
          fontSize: "1.125rem",
          fontWeight: 700,
          color: "var(--color-ink-primary)",
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: "0.9375rem",
          color: "var(--color-ink-secondary)",
          lineHeight: 1.8,
        }}
      >
        {children}
      </div>
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p style={{ marginBottom: 12 }}>{children}</p>;
}

export function Ul({ children }: { children: React.ReactNode }) {
  return (
    <ul
      style={{
        paddingLeft: 20,
        marginBottom: 12,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {children}
    </ul>
  );
}
