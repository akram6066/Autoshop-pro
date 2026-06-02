"use client";

import { useState, useTransition } from "react";
import { saveTrialSettings } from "../_actions";

interface Props {
  initialEnabled: boolean;
  initialDays: number;
  updatedAt: string | null;
}

export function TrialSettingsCard({
  initialEnabled,
  initialDays,
  updatedAt,
}: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [days, setDays] = useState(initialDays);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await saveTrialSettings(enabled, days);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  const daysLabel =
    days === 30
      ? "1 month"
      : days === 7
        ? "1 week"
        : days === 14
          ? "2 weeks"
          : `${days} days`;

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 3,
            }}
          >
            Free Trial Badge
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "#64748b" }}>
            Controls the &ldquo;Free Trial&rdquo; badge shown on Pro &amp; Ultra
            Pro plan cards during signup.
          </p>
        </div>

        {/* Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          disabled={pending}
          style={{
            width: 52,
            height: 28,
            borderRadius: 999,
            border: "none",
            background: enabled ? "#16a34a" : "#cbd5e1",
            cursor: "pointer",
            padding: 3,
            display: "flex",
            alignItems: "center",
            transition: "background 0.2s",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              transform: enabled ? "translateX(24px)" : "translateX(0)",
              transition: "transform 0.2s",
              display: "block",
            }}
          />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "24px" }}>
        {/* Status info */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: enabled ? "#f0fdf4" : "#f8fafc",
            border: `1px solid ${enabled ? "#bbf7d0" : "#e2e8f0"}`,
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: enabled ? "#16a34a" : "#94a3b8",
              flexShrink: 0,
            }}
          />
          <p
            style={{
              fontSize: "0.875rem",
              color: enabled ? "#15803d" : "#64748b",
              margin: 0,
            }}
          >
            {enabled
              ? `New shops get a free ${daysLabel} trial of the Pro plan on signup.`
              : "Trial is off — new shops start on the Free plan (basic limits)."}
          </p>
        </div>

        {/* Days input — only shown when enabled */}
        {enabled && (
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#0f172a",
                marginBottom: 8,
              }}
            >
              Trial duration (days)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                disabled={pending}
                style={{
                  width: 100,
                  padding: "9px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: "#0f172a",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
                = {daysLabel}
              </span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 6 }}>
              The badge will say &ldquo;{days} days free trial&rdquo; on the
              signup pricing page.
            </p>

            {/* Quick presets */}
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 10,
                flexWrap: "wrap",
              }}
            >
              {[7, 14, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: "1px solid",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: days === d ? "#0f172a" : "white",
                    color: days === d ? "white" : "#475569",
                    borderColor: days === d ? "#0f172a" : "#e2e8f0",
                  }}
                >
                  {d === 7
                    ? "1 week"
                    : d === 14
                      ? "2 weeks"
                      : d === 30
                        ? "1 month"
                        : d === 60
                          ? "2 months"
                          : "3 months"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview badge */}
        {enabled && (
          <div style={{ marginBottom: 24 }}>
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#0f172a",
                marginBottom: 8,
              }}
            >
              Badge preview
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  background: "#dcfce7",
                  color: "#15803d",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "4px 14px",
                  borderRadius: 999,
                  border: "1.5px solid #15803d33",
                }}
              >
                {days} Day{days !== 1 ? "s" : ""} Free Trial
              </span>
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                ← shown on Pro &amp; Ultra Pro cards
              </span>
            </div>
          </div>
        )}

        {/* Save */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            style={{
              padding: "9px 24px",
              borderRadius: 8,
              border: "none",
              background: "#0f172a",
              color: "white",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: pending ? "not-allowed" : "pointer",
              opacity: pending ? 0.6 : 1,
            }}
          >
            {pending ? "Saving…" : "Save settings"}
          </button>

          {saved && (
            <span
              style={{
                fontSize: "0.875rem",
                color: "#16a34a",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Saved
            </span>
          )}

          {updatedAt && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "#94a3b8",
                marginLeft: "auto",
              }}
            >
              Last updated {new Date(updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
