"use client";

import { useState, useEffect } from "react";
import { useRecordCustomerPayment } from "@/hooks/useCustomers";
import { formatCurrency } from "@/lib/utils";
import { friendlyError } from "@/lib/api/errors";
import type { Customer } from "@/types/app";

interface Props {
  customer: Customer;
  shopId: string;
  userId: string;
  onClose: () => void;
}

export function CollectDebtModal({ customer, shopId, userId, onClose }: Props) {
  const { mutateAsync: recordPayment, isPending } = useRecordCustomerPayment();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [finalBalance, setFinalBalance] = useState<number | null>(null);

  const owed = Math.abs(customer.balance);
  const parsed = parseFloat(amount);
  const isValid = !isNaN(parsed) && parsed > 0;
  const isOverpayment = isValid && parsed > owed;
  const balanceAfter = isValid ? customer.balance + parsed : null;
  const succeeded = finalBalance !== null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, isPending]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setError("Enter a valid amount above 0");
      return;
    }
    setError("");
    try {
      await recordPayment({
        shopId,
        customerId: customer.id,
        userId,
        amount: parsed,
        note: note.trim() || undefined,
      });
      setFinalBalance(customer.balance + parsed);
      setTimeout(onClose, 1400);
    } catch (err: unknown) {
      setError(friendlyError(err, "Failed to record payment"));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={() => !isPending && !succeeded && onClose()}
    >
      <div
        className="w-full max-w-sm p-6 rounded-2xl"
        style={{
          background: "var(--color-popup-bg, #ffffff)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--color-popup-shadow, 0 8px 32px rgba(0,0,0,0.18))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--color-ink-primary)" }}
            >
              Collect payment
            </h2>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              {customer.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Close"
            className="btn btn-icon btn-ghost"
            style={{ marginTop: -4, marginRight: -8 }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Outstanding debt summary */}
        <div
          className="rounded-lg px-4 py-3 mb-5"
          style={{
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.18)",
          }}
        >
          <p
            className="text-xs uppercase tracking-wider mb-0.5"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            Outstanding debt
          </p>
          <p
            className="text-2xl font-semibold"
            style={{ color: "var(--color-danger)" }}
          >
            {formatCurrency(owed)}
          </p>
        </div>

        {/* Success state */}
        {succeeded ? (
          <div className="text-center py-3">
            <p
              className="text-base font-semibold"
              style={{ color: "var(--color-success)" }}
            >
              Payment recorded
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              {finalBalance >= 0
                ? "Account is now settled."
                : `${formatCurrency(Math.abs(finalBalance))} still remaining`}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--color-ink-secondary)" }}
                >
                  Amount (KES)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAmount(String(owed));
                    setError("");
                  }}
                  className="text-xs font-medium"
                  style={{ color: "var(--color-brand-600)" }}
                >
                  Pay in full
                </button>
              </div>
              <input
                type="number"
                min="1"
                step="any"
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                className="input w-full"
                autoFocus
              />
            </div>

            {/* Note */}
            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--color-ink-secondary)" }}
              >
                Note (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Cash received"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input w-full"
              />
            </div>

            {/* Balance preview or overpayment warning */}
            {isValid &&
              balanceAfter !== null &&
              (isOverpayment ? (
                <div
                  className="rounded-lg px-3 py-2.5"
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.28)",
                  }}
                >
                  <p
                    className="text-xs font-semibold mb-0.5"
                    style={{ color: "var(--color-warning)" }}
                  >
                    Exceeds debt by {formatCurrency(parsed - owed)}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-ink-secondary)" }}
                  >
                    Customer will get a credit of{" "}
                    <strong>{formatCurrency(balanceAfter)}</strong>. Only
                    confirm if this is intentional.
                  </p>
                </div>
              ) : (
                <p
                  className="text-xs"
                  style={{ color: "var(--color-ink-tertiary)" }}
                >
                  Balance after:{" "}
                  <span
                    style={{
                      fontWeight: 500,
                      color:
                        balanceAfter >= 0
                          ? "var(--color-success)"
                          : "var(--color-danger)",
                    }}
                  >
                    {balanceAfter >= 0
                      ? "Settled"
                      : `${formatCurrency(Math.abs(balanceAfter))} remaining`}
                  </span>
                </p>
              ))}

            {error && (
              <p className="text-sm" style={{ color: "var(--color-danger)" }}>
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isPending || !isValid}
                className={`btn btn-sm flex-1 ${!isOverpayment ? "btn-primary" : ""}`}
                style={{
                  background: isOverpayment
                    ? "var(--color-warning)"
                    : undefined,
                  color: isOverpayment ? "#fff" : undefined,
                  opacity: isPending || !isValid ? 0.6 : 1,
                }}
              >
                {isPending
                  ? "Saving…"
                  : isOverpayment
                    ? "Confirm overpayment"
                    : "Record payment"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
