export default function FinderLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div
          className="h-8 w-36 rounded mb-2 animate-pulse-soft"
          style={{ background: "var(--color-skeleton)" }}
        />
        <div
          className="h-4 w-64 rounded animate-pulse-soft"
          style={{ background: "var(--color-skeleton-subtle)" }}
        />
      </div>

      {/* Search bar */}
      <div
        className="h-12 w-full rounded-xl mb-6 animate-pulse-soft"
        style={{ background: "var(--color-skeleton-subtle)" }}
      />

      {/* Idle prompt placeholder */}
      <div className="flex flex-col items-center py-16 gap-3">
        <div
          className="w-10 h-10 rounded-full animate-pulse-soft"
          style={{ background: "var(--color-skeleton-subtle)" }}
        />
        <div
          className="h-4 w-40 rounded animate-pulse-soft"
          style={{ background: "var(--color-skeleton-subtle)" }}
        />
      </div>
    </div>
  );
}

