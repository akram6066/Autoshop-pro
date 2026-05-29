"use client";

export function Section({
  title,
  children,
  danger = false,
}: {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className="card overflow-hidden mb-6 animate-fade-in-up"
      style={danger ? { borderColor: "var(--color-danger)" } : undefined}
    >
      <div
        className="px-4 py-3 sm:px-5 sm:py-4"
        style={{
          borderBottom: "1px solid var(--color-border)",
          ...(danger ? { background: "var(--color-danger-light)" } : {}),
        }}
      >
        <h2
          className="font-medium"
          style={danger ? { color: "var(--color-danger)" } : undefined}
        >
          {title}
        </h2>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
