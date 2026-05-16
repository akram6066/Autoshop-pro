export default function ErrorBox({
  message,
  variant = "error",
}: {
  message: string;
  variant?: "error" | "warning";
}) {
  const isWarning = variant === "warning";
  const color = isWarning ? "var(--color-warning)" : "var(--color-danger)";
  const bg = isWarning
    ? "var(--color-warning-light)"
    : "var(--color-danger-light)";
  const textColor = isWarning
    ? "var(--color-warning-text)"
    : "var(--color-danger)";

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        background: bg,
        border: `1px solid ${color}`,
      }}
    >
      <svg
        width="15"
        height="15"
        fill="none"
        viewBox="0 0 24 24"
        style={{ color, flexShrink: 0, marginTop: 1 }}
      >
        {isWarning ? (
          <>
            <path
              d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 9v4M12 16h.01"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="1.75"
            />
            <path
              d="M12 8v4M12 16h.01"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
      <p
        style={{
          fontSize: "0.875rem",
          color: textColor,
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>
    </div>
  );
}
