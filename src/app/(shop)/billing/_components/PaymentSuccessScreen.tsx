"use client";

import { useRouter } from "next/navigation";

export function PaymentSuccessScreen() {
  const router = useRouter();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 0 8px",
        gap: 12,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#dcfce7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
          <path
            d="M22 11.08V12a10 10 0 11-5.93-9.14"
            stroke="#15803d"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M22 4L12 14.01l-3-3"
            stroke="#15803d"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p
        style={{
          fontSize: "1.125rem",
          fontWeight: 700,
          color: "var(--color-ink-primary)",
        }}
      >
        Payment successful!
      </p>
      <p style={{ fontSize: "0.875rem", color: "var(--color-ink-tertiary)" }}>
        Your Pro subscription is now active.
      </p>
      <button
        className="btn btn-primary"
        style={{ marginTop: 8 }}
        onClick={() => router.push("/dashboard")}
      >
        Refresh page
      </button>
    </div>
  );
}
