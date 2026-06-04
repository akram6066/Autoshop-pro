import { useState } from "react";
import type { Plan } from "./plan-meta";

function validatePhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return (
    (digits.startsWith("254") && digits.length === 12) ||
    (digits.startsWith("07") && digits.length === 10) ||
    (digits.startsWith("01") && digits.length === 10) ||
    digits.length === 9
  );
}

export function PhoneStep({
  plan,
  trialDays,
  isPending,
  onBack,
  onSubmit,
}: {
  plan: Plan;
  trialDays: number;
  isPending: boolean;
  onBack: () => void;
  onSubmit: (phone: string | undefined) => void;
}) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const planLabel = plan.name === "ultra_pro" ? "Ultra Pro" : plan.display_name;
  const priceKes = plan.price_kes.toLocaleString();

  function handleStart() {
    setError("");
    const trimmed = phone.trim();
    if (trimmed && !validatePhone(trimmed)) {
      setError("Enter a valid Kenyan number, e.g. 0712 345 678");
      return;
    }
    onSubmit(trimmed || undefined);
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 460,
        margin: "0 auto",
        background: "var(--color-surface-0)",
        border: "1.5px solid var(--color-border)",
        borderRadius: 20,
        padding: "40px 36px 32px",
        boxShadow: "var(--shadow-raised)",
      }}
    >
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--color-ink-tertiary)",
          fontSize: "0.875rem",
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 28,
          padding: 0,
        }}
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path
            d="M19 12H5M12 5l-7 7 7 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to plans
      </button>

      {/* Trial badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "#dcfce7",
          color: "#15803d",
          fontSize: "0.8125rem",
          fontWeight: 700,
          padding: "5px 14px",
          borderRadius: 999,
          marginBottom: 20,
        }}
      >
        🎉 {trialDays}-day free trial
      </div>

      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--color-ink-primary)",
          marginBottom: 8,
          letterSpacing: "-0.02em",
        }}
      >
        Start your {planLabel} trial
      </h2>
      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--color-ink-secondary)",
          marginBottom: 28,
          lineHeight: 1.5,
        }}
      >
        Try everything free for {trialDays} days. After that, KES {priceKes}/mo
        — we&apos;ll send an M-Pesa prompt to your phone so you confirm before
        any charge.
      </p>

      {/* Phone input */}
      <div style={{ marginBottom: 20 }}>
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
          <span
            style={{
              fontWeight: 400,
              color: "var(--color-ink-tertiary)",
              marginLeft: 6,
            }}
          >
            (optional)
          </span>
        </label>
        <input
          type="tel"
          placeholder="e.g. 0712 345 678"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setError("");
          }}
          className="input"
          style={{ width: "100%" }}
          autoFocus
        />
        {error && (
          <p
            style={{
              marginTop: 6,
              fontSize: "0.8125rem",
              color: "var(--color-danger)",
            }}
          >
            {error}
          </p>
        )}
      </div>

      {/* Info box */}
      <div
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: 10,
          padding: "12px 14px",
          marginBottom: 24,
          fontSize: "0.8125rem",
          color: "var(--color-ink-secondary)",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "var(--color-ink-primary)" }}>
          No charge today.
        </strong>{" "}
        When your trial ends we send an M-Pesa STK push — you enter your PIN to
        confirm. You can cancel auto-billing anytime from Settings.
        {!phone && (
          <>
            {" "}
            <span style={{ color: "var(--color-ink-tertiary)" }}>
              Skip the number now and add it later in Settings → Plan.
            </span>
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          type="button"
          onClick={handleStart}
          disabled={isPending}
          style={{
            width: "100%",
            padding: "13px 0",
            borderRadius: 10,
            border: "none",
            background: "var(--color-brand-600)",
            color: "white",
            fontSize: "0.9375rem",
            fontWeight: 700,
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.65 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {isPending
            ? "Starting trial…"
            : `Start ${trialDays}-day free trial →`}
        </button>

        {phone && (
          <button
            type="button"
            onClick={() => onSubmit(undefined)}
            disabled={isPending}
            style={{
              width: "100%",
              padding: "11px 0",
              borderRadius: 10,
              border: "1.5px solid var(--color-border-input)",
              background: "transparent",
              color: "var(--color-ink-tertiary)",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: isPending ? "not-allowed" : "pointer",
            }}
          >
            Skip billing setup — start trial without M-Pesa
          </button>
        )}
      </div>
    </div>
  );
}
