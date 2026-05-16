export default function POSLoading() {
  return (
    <div className="flex flex-col sm:flex-row gap-6 sm:h-[calc(100vh-7rem)]">
      {/* Product grid */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search + category filters */}
        <div className="flex gap-3 mb-4">
          <div
            className="h-9 flex-1 rounded-lg animate-pulse-soft"
            style={{ background: "var(--color-surface-2)" }}
          />
          <div className="flex gap-1">
            {[60, 80, 70].map((w) => (
              <div
                key={w}
                className="h-9 rounded animate-pulse-soft"
                style={{ width: w, background: "var(--color-surface-2)" }}
              />
            ))}
          </div>
        </div>

        {/* Product cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-xl animate-pulse-soft"
              style={{ background: "var(--color-surface-2)" }}
            />
          ))}
        </div>
      </div>

      {/* Cart panel — desktop only */}
      <div
        className="hidden sm:flex sm:w-80 flex-col card p-0 overflow-hidden flex-shrink-0 animate-pulse-soft"
        style={{ background: "var(--color-surface-2)" }}
      />
    </div>
  );
}
