export default function SettingsLoading() {
  const section = (lines: number) => (
    <div
      className="card p-5 mb-6 animate-pulse-soft"
      style={{ background: "var(--color-surface-1)" }}
    >
      <div
        className="h-5 w-36 rounded mb-4"
        style={{ background: "var(--color-surface-3)" }}
      />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-9 rounded-lg mb-3"
          style={{ background: "var(--color-surface-2)" }}
        />
      ))}
    </div>
  );

  return (
    <div className="max-w-2xl">
      {/* Page heading */}
      <div className="mb-8">
        <div
          className="h-8 w-28 rounded mb-2 animate-pulse-soft"
          style={{ background: "var(--color-surface-3)" }}
        />
        <div
          className="h-4 w-52 rounded animate-pulse-soft"
          style={{ background: "var(--color-surface-3)" }}
        />
      </div>

      {section(3)}
      {section(2)}
      {section(4)}
    </div>
  );
}
