"use client";

type Stage = "waiting" | "confirming";

export function PaymentWaitingScreen({
  stage,
  message,
  priceKes,
  onCheckStatus,
  onCancel,
}: {
  stage: Stage;
  message: string;
  priceKes: number;
  onCheckStatus: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          background: "var(--color-success-light)",
          border: "1px solid var(--color-success)",
          borderRadius: 10,
          padding: "14px 16px",
          alignItems: "flex-start",
        }}
      >
        <svg
          width="18"
          height="18"
          fill="none"
          viewBox="0 0 24 24"
          style={{ flexShrink: 0, marginTop: 1, color: "var(--color-success)" }}
        >
          <path
            d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm0-11v5m0-8h.01"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
        <div>
          <p
            style={{
              fontWeight: 600,
              color: "var(--color-success)",
              marginBottom: 2,
              fontSize: "0.9375rem",
            }}
          >
            Check your phone
          </p>
          <p
            style={{ fontSize: "0.875rem", color: "var(--color-success-text)" }}
          >
            {message}
          </p>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-success)",
              marginTop: 4,
            }}
          >
            Enter your M-Pesa PIN to complete payment of{" "}
            <strong>KES {priceKes.toLocaleString()}</strong>.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          className="btn btn-primary"
          onClick={onCheckStatus}
          disabled={stage === "confirming"}
          style={{ flex: 1 }}
        >
          {stage === "confirming" ? (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                style={{ animation: "spin 0.7s linear infinite" }}
              >
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeOpacity="0.25"
                />
                <path
                  d="M12 2a10 10 0 019.8 8"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              Checking…
            </>
          ) : (
            "I've paid — confirm payment"
          )}
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
