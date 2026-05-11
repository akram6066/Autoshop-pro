"use client";

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-surface-1)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 360, padding: "0 24px" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--color-surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path
              d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"
              stroke="var(--color-ink-tertiary)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "var(--color-ink-primary)",
            marginBottom: 8,
            fontFamily: "var(--font-sans)",
          }}
        >
          You&apos;re offline
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--color-ink-tertiary)",
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          No internet connection. Any sales you record will sync automatically
          once you&apos;re back online.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: 40,
            padding: "0 20px",
            background: "var(--color-brand-500)",
            color: "white",
            border: "1px solid var(--color-brand-600)",
            borderRadius: "var(--radius-md)",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
