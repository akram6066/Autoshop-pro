export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse-soft">
      {/* Header */}
      <div className="mb-8">
        <div className="h-4 w-32 rounded mb-2" style={{ background: "var(--color-skeleton)" }} />
        <div className="h-9 w-40 rounded" style={{ background: "var(--color-skeleton)" }} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="h-3 w-24 rounded mb-4" style={{ background: "var(--color-skeleton)" }} />
            <div className="h-8 w-28 rounded" style={{ background: "var(--color-skeleton)" }} />
          </div>
        ))}
      </div>

      {/* Table placeholder */}
      <div className="card p-5">
        <div className="h-5 w-36 rounded mb-4" style={{ background: "var(--color-skeleton)" }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded mb-2" style={{ background: "var(--color-skeleton-subtle)" }} />
        ))}
      </div>
    </div>
  );
}

