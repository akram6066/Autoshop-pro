export function AdminOverrideBanner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "18px 22px",
        borderRadius: 12,
        background: "var(--color-badge-purple-bg)",
        border: "1px solid var(--color-badge-purple-border)",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: "var(--color-badge-purple-text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            stroke="white"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <p
          style={{
            fontSize: "0.9375rem",
            fontWeight: 700,
            color: "var(--color-badge-purple-text)",
            marginBottom: 2,
          }}
        >
          Free unlimited access
        </p>
        <p
          style={{ fontSize: "0.8125rem", color: "var(--color-ink-tertiary)" }}
        >
          Your account has been granted complimentary access by an admin. No
          payment required.
        </p>
      </div>
    </div>
  );
}
