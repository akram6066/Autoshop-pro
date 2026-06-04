"use client";

import Link from "next/link";
import { useSubscription } from "@/hooks/useSubscription";

export function TrialBanner() {
  const { sub, subLoading } = useSubscription();

  if (subLoading || !sub) return null;

  // Only show for paid-plan trials that are actually counting down
  const isPaidTrial =
    sub.status === "trial" && sub.plan.priceKes > 0 && sub.daysLeft < 9999;
  if (!isPaidTrial) return null;

  // Show when 7 days or fewer remain
  if (sub.daysLeft > 7) return null;

  const planLabel =
    sub.plan.name === "ultra_pro"
      ? "Ultra Pro"
      : (sub.plan.displayName ?? "Pro");
  const priceKes = sub.plan.priceKes.toLocaleString();
  const isUrgent = sub.daysLeft <= 3;
  const isExpired = sub.daysLeft === 0;

  const billingPhone = (sub as { billingPhone?: string | null }).billingPhone;
  const autoBillAtEnd = (sub as { autoBillAtEnd?: boolean }).autoBillAtEnd;

  const phoneDisplay = billingPhone
    ? billingPhone
        .replace(/^254/, "0")
        .replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")
    : null;

  return (
    <div
      role="alert"
      style={{
        background: isUrgent ? "var(--color-danger)" : "#f59e0b",
        color: "white",
        padding: "10px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "var(--max-w, 1280px)",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Icon */}
        <svg
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          style={{ flexShrink: 0 }}
        >
          <path
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Message */}
        <p
          style={{ flex: 1, margin: 0, fontSize: "0.875rem", fontWeight: 500 }}
        >
          {isExpired ? (
            <>
              Your <strong>{planLabel}</strong> trial has ended.{" "}
              {autoBillAtEnd && billingPhone
                ? `An M-Pesa prompt will be sent to ${phoneDisplay} shortly.`
                : "Add your M-Pesa number to keep Pro access."}
            </>
          ) : (
            <>
              Your <strong>{planLabel}</strong> trial ends in{" "}
              <strong>
                {sub.daysLeft} day{sub.daysLeft === 1 ? "" : "s"}
              </strong>
              .{" "}
              {autoBillAtEnd && billingPhone
                ? `KES ${priceKes}/mo will be sent to ${phoneDisplay} for M-Pesa confirmation.`
                : `Add your M-Pesa number to continue at KES ${priceKes}/mo.`}
            </>
          )}
        </p>

        {/* CTA */}
        <Link
          href="/settings/plan"
          style={{
            flexShrink: 0,
            background: "rgba(255,255,255,0.2)",
            color: "white",
            fontSize: "0.8125rem",
            fontWeight: 700,
            padding: "6px 14px",
            borderRadius: 8,
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.3)",
            whiteSpace: "nowrap",
          }}
        >
          {autoBillAtEnd && billingPhone
            ? "Manage billing"
            : "Add M-Pesa number"}
        </Link>
      </div>
    </div>
  );
}
