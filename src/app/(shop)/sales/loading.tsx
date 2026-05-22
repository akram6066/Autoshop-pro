export default function SalesLoading() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div
            className="h-8 w-40 rounded mb-2 animate-pulse-soft"
            style={{ background: "var(--color-surface-3)" }}
          />
          <div
            className="h-4 w-28 rounded animate-pulse-soft"
            style={{ background: "var(--color-surface-2)" }}
          />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="card">
        {/* Table header row */}
        <div
          className="h-10 mx-4 my-2 rounded animate-pulse-soft"
          style={{ background: "var(--color-surface-3)" }}
        />
        {Array.from({ length: 8 }).map((_, i) => (
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
