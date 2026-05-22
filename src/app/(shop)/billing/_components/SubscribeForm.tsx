"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
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

  if (stage === "waiting" || stage === "confirming") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
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
            style={{ flexShrink: 0, marginTop: 1, color: "#15803d" }}
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
                color: "#15803d",
                marginBottom: 2,
                fontSize: "0.9375rem",
              }}
            >
              Check your phone
            </p>
            <p style={{ fontSize: "0.875rem", color: "#166534" }}>{message}</p>
            <p
              style={{ fontSize: "0.8125rem", color: "#4ade80", marginTop: 4 }}
            >
              Enter your M-Pesa PIN to complete payment of{" "}
              <strong>KES {priceKes.toLocaleString()}</strong>.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={handleCheckStatus}
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
              "I’ve paid — confirm payment"
            )}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setStage("idle");
              setMessage("");
            }}
          >
            Cancel
          </button>
        </div>
      </div>
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
          className="btn btn-primary"
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
