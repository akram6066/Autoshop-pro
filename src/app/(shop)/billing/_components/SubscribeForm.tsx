"use client";

import { useState } from "react";
import { PaymentSuccessScreen } from "./PaymentSuccessScreen";
import { PaymentWaitingScreen } from "./PaymentWaitingScreen";

type Stage =
  | "idle"
  | "pending"
  | "waiting"
  | "confirming"
  | "success"
  | "error";

export function SubscribeForm({
  priceKes,
  planName,
}: {
  priceKes: number;
  planName?: string;
}) {
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [message, setMessage] = useState("");

  async function handlePay() {
    if (!phone.trim()) return;
    setStage("pending");
    setMessage("");

    try {
      const res = await fetch("/api/subscription/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, plan: planName ?? "pro" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStage("error");
        setMessage(data.error ?? "Payment request failed. Try again.");
        return;
      }

      setStage("waiting");
      setMessage(data.message ?? "Check your phone for the M-Pesa prompt.");
    } catch {
      setStage("error");
      setMessage("Network error. Check your connection and try again.");
    }
  }

  async function handleCheckStatus() {
    setStage("confirming");
    setMessage("");
    try {
      const res = await fetch("/api/subscription/status");
      const data = await res.json();
      if (data.isActive && data.status !== "trial") {
        setStage("success");
      } else {
        setStage("waiting");
        setMessage(
          "Payment not yet confirmed. Wait a few seconds and try again.",
        );
      }
    } catch {
      setStage("waiting");
      setMessage(
        "Could not check status. Check your connection and try again.",
      );
    }
  }

  if (stage === "success") {
    return <PaymentSuccessScreen />;
  }

  if (stage === "waiting" || stage === "confirming") {
    return (
      <PaymentWaitingScreen
        stage={stage}
        message={message}
        priceKes={priceKes}
        onCheckStatus={handleCheckStatus}
        onCancel={() => {
          setStage("idle");
          setMessage("");
        }}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label
          style={{
            display: "block",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--color-ink-secondary)",
            marginBottom: 6,
          }}
        >
          M-Pesa phone number
        </label>
        <input
          className="input"
          type="tel"
          placeholder="07XX XXX XXX or 254XXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={stage === "pending"}
          onKeyDown={(e) => e.key === "Enter" && handlePay()}
          style={{ maxWidth: 320 }}
        />
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--color-ink-ghost)",
            marginTop: 5,
          }}
        >
          You will receive a payment prompt on this number.
        </p>
      </div>

      {stage === "error" && (
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-danger)",
            padding: "10px 14px",
            background: "var(--color-danger-light)",
            borderRadius: 8,
          }}
        >
          {message}
        </p>
      )}

      <div>
        <button
          className="btn btn-primary w-full sm:w-auto"
          onClick={handlePay}
          disabled={stage === "pending" || !phone.trim()}
        >
          {stage === "pending" ? (
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
              Sending request…
            </>
          ) : (
            <>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path
                  d="M2 8.5h20M6 12h.01M10 12h.01M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Pay KES {priceKes.toLocaleString()} with M-Pesa
            </>
          )}
        </button>
      </div>
    </div>
  );
}
