export default function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-danger-light)",
        border: "1px solid var(--color-danger)",
      }}
    >
      <svg
        width="15"
        height="15"
        fill="none"
        viewBox="0 0 24 24"
        style={{ color: "var(--color-danger)", flexShrink: 0, marginTop: 1 }}
      >
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
      </svg>
      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--color-danger)",
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>
    </div>
  );
}
