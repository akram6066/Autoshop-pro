export default function InventoryLoading() {
  const row = (
    <div
      className="h-14 mx-4 my-2 rounded-lg animate-pulse-soft"
      style={{ background: "var(--color-surface-2)" }}
    />
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div
            className="h-8 w-32 rounded mb-2 animate-pulse-soft"
            style={{ background: "var(--color-surface-3)" }}
          />
          <div
            className="h-4 w-24 rounded animate-pulse-soft"
            style={{ background: "var(--color-surface-3)" }}
          />
        </div>
        <div
          className="h-9 w-32 rounded-lg animate-pulse-soft"
          style={{ background: "var(--color-surface-3)" }}
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div
          className="h-9 flex-1 min-w-48 rounded-lg animate-pulse-soft"
          style={{ background: "var(--color-surface-2)" }}
        />
        {[140, 130, 120].map((w) => (
          <div
            key={w}
            className="h-9 rounded-lg animate-pulse-soft"
            style={{ width: w, background: "var(--color-surface-2)" }}
          />
        ))}
      </div>

      {/* Table */}
      <div className="card">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i}>{row}</div>
        ))}
      </div>
    </div>
  );
}
