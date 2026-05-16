export default function CustomersLoading() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div
            className="h-8 w-36 rounded mb-2 animate-pulse-soft"
            style={{ background: "var(--color-surface-3)" }}
          />
          <div
            className="h-4 w-20 rounded animate-pulse-soft"
            style={{ background: "var(--color-surface-3)" }}
          />
        </div>
        <div
          className="h-8 w-32 rounded-lg animate-pulse-soft"
          style={{ background: "var(--color-surface-3)" }}
        />
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <div
          className="h-9 w-full rounded-lg animate-pulse-soft"
          style={{ background: "var(--color-surface-2)" }}
        />
      </div>

      {/* Table */}
      <div className="card">
        {/* Table header */}
        <div
          className="h-10 mx-4 my-2 rounded animate-pulse-soft"
          style={{ background: "var(--color-surface-3)" }}
        />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-14 mx-4 my-2 rounded-lg animate-pulse-soft"
            style={{ background: "var(--color-surface-2)" }}
          />
        ))}
      </div>
    </div>
  );
}
