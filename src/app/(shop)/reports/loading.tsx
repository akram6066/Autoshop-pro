export default function ReportsLoading() {
  return (
    <div className="animate-pulse-soft">
      <div className="mb-8">
        <div className="h-9 w-36 rounded mb-2" style={{ background: "var(--color-skeleton)" }} />
        <div className="h-4 w-52 rounded" style={{ background: "var(--color-skeleton)" }} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="h-3 w-20 rounded mb-3" style={{ background: "var(--color-skeleton)" }} />
            <div className="h-7 w-28 rounded" style={{ background: "var(--color-skeleton)" }} />
          </div>
        ))}
      </div>
      <div className="card p-5 h-64 mb-6" style={{ background: "var(--color-skeleton-subtle)" }} />
    </div>
  );
}

