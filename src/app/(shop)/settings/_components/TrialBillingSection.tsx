"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  cancelTrialAutoBilling,
  updateBillingPhone,
} from "@/app/(auth)/choose-plan/_actions";
import type { SubInfo } from "./sub-types";

function formatPhone(raw: string) {
  return raw.replace(/^254/, "0").replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
}

export function TrialBillingSection({ sub }: { sub: SubInfo }) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [editPhone, setEditPhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const isPaidTrial =
    sub.status === "trial" && sub.plan.priceKes > 0 && sub.daysLeft < 9999;
  if (!isPaidTrial) return null;

  const phoneDisplay = sub.billingPhone ? formatPhone(sub.billingPhone) : null;
  const trialEnd = sub.trialEndsAt
    ? new Date(sub.trialEndsAt).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  function handleCancelBilling() {
    setMsg("");
    startTransition(async () => {
      await cancelTrialAutoBilling();
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      setMsg(
        "Auto-billing cancelled. Your Pro access continues until the trial ends.",
      );
    });
  }

  function handleSavePhone(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    startTransition(async () => {
      const result = await updateBillingPhone(phone);
      if (result?.error) {
        setErr(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
        setMsg("Billing number updated.");
        setEditPhone(false);
        setPhone("");
      }
    });
  }

  return (
    <div
      style={{
        marginTop: 20,
        borderTop: "1px solid var(--color-border-subtle)",
        paddingTop: 16,
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: "var(--color-ink-tertiary)" }}
      >
        Trial billing
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {trialEnd && (
          <p
            className="text-sm"
            style={{ color: "var(--color-ink-secondary)" }}
          >
            Trial ends:{" "}
            <strong style={{ color: "var(--color-ink-primary)" }}>
              {trialEnd}
            </strong>
          </p>
        )}

        {sub.billingPhone ? (
          <p
            className="text-sm"
            style={{ color: "var(--color-ink-secondary)" }}
          >
            Billing to:{" "}
            <strong style={{ color: "var(--color-ink-primary)" }}>
              {phoneDisplay}
            </strong>{" "}
            <button
              type="button"
              onClick={() => setEditPhone(true)}
              style={{
                color: "var(--color-brand-600)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Change
            </button>
          </p>
        ) : (
          <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
            No billing number set.{" "}
            <button
              type="button"
              onClick={() => setEditPhone(true)}
              style={{
                color: "var(--color-brand-600)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Add M-Pesa number
            </button>
          </p>
        )}

        {editPhone && (
          <form
            onSubmit={handleSavePhone}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              type="tel"
              placeholder="e.g. 0712 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              style={{ flex: 1, minWidth: 180 }}
              autoFocus
            />
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary btn-sm"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditPhone(false);
                setErr("");
              }}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
          </form>
        )}

        {err && (
          <p className="text-sm" style={{ color: "var(--color-danger)" }}>
            {err}
          </p>
        )}
        {msg && (
          <p className="text-sm" style={{ color: "var(--color-success)" }}>
            {msg}
          </p>
        )}

        {sub.autoBillAtEnd && !msg && (
          <button
            type="button"
            onClick={handleCancelBilling}
            disabled={isPending}
            className="text-sm"
            style={{
              background: "none",
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
              color: "var(--color-danger)",
              padding: 0,
              textAlign: "left",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? "Cancelling…" : "Cancel auto-billing →"}
          </button>
        )}
      </div>
    </div>
  );
}
