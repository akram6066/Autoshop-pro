export default function ActivityLoading() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div
            className="h-8 w-32 rounded mb-2 animate-pulse-soft"
            style={{ background: "var(--color-skeleton)" }}
          />
          <div
            className="h-4 w-48 rounded animate-pulse-soft"
            style={{ background: "var(--color-skeleton-subtle)" }}
          />
        </div>
        <div
          className="h-8 w-24 rounded-lg animate-pulse-soft"
          style={{ background: "var(--color-skeleton-subtle)" }}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[64, 56, 52, 80, 72].map((w, i) => (
          <div
            key={i}
            className="h-8 rounded-lg animate-pulse-soft"
            style={{ width: w, background: "var(--color-skeleton-subtle)" }}
          />
        ))}
      </div>

      {/* Event feed */}
      <div
        className="card divide-y"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse-soft"
              style={{ background: "var(--color-skeleton)" }}
            />
            <div className="flex-1 space-y-2">
              <div
                className="h-4 w-48 rounded animate-pulse-soft"
                style={{ background: "var(--color-skeleton-subtle)" }}
              />
              <div
                className="h-3 w-32 rounded animate-pulse-soft"
                style={{ background: "var(--color-skeleton-subtle)" }}
              />
            </div>
            <div
              className="h-3 w-16 rounded animate-pulse-soft flex-shrink-0"
              style={{ background: "var(--color-skeleton-subtle)" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

