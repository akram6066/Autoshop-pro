export function AdminOverrideBanner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "var(--color-brand-50)",
        border: "1px solid var(--color-brand-200)",
        borderRadius: 10,
        padding: "14px 18px",
        fontSize: "0.875rem",
        color: "var(--color-brand-700)",
      }}
    >
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Your account has been granted free unlimited access by an admin.
    </div>
  );
}
