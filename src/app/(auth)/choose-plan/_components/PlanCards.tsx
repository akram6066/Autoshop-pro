"use client";

import { useState, useTransition } from "react";
import { choosePlan } from "../_actions";
import { buildPlanMeta, type Plan } from "./plan-meta";
import { PlanCard } from "./PlanCard";
import { PhoneStep } from "./PhoneStep";

const PLAN_ORDER = ["trial", "pro", "ultra_pro"] as const;

export function PlanCards({
  plans,
  trialEnabled,
  trialDays,
  initialPlan,
  initialInterval,
}: {
  plans: Plan[];
  trialEnabled: boolean;
  trialDays: number;
  initialPlan?: string;
  initialInterval?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [stage, setStage] = useState<"plans" | "phone">("plans");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    (initialInterval === "annual" ? "annual" : "monthly") as
      | "monthly"
      | "annual",
  );
  const [hasCheckedInitial, setHasCheckedInitial] = useState(false);

  // Pre-select plan if passed in URL parameters
  if (!hasCheckedInitial && initialPlan) {
    const plan = plans.find((p) => p.name === initialPlan);
    if (plan) {
      if (initialPlan === "trial" || plan.price_kes === 0) {
        setHasCheckedInitial(true);
        startTransition(() => choosePlan(initialPlan, undefined, billingCycle));
      } else if (trialEnabled) {
        setHasCheckedInitial(true);
        setSelectedPlan(plan);
        setStage("phone");
      } else {
        setHasCheckedInitial(true);
        startTransition(() => choosePlan(initialPlan, undefined, billingCycle));
      }
    }
  }

  const planMeta = buildPlanMeta(trialEnabled, trialDays);

  function handleCardChoose(planName: string) {
    const plan = plans.find((p) => p.name === planName);
    if (!plan) return;

    // Free plan: skip phone collection
    if (planName === "trial" || plan.price_kes === 0) {
      startTransition(() => choosePlan(planName, undefined, billingCycle));
      return;
    }

    // Paid trial: collect M-Pesa number first
    if (trialEnabled) {
      setSelectedPlan(plan);
      setStage("phone");
      return;
    }

    // Trial disabled (e.g. direct purchase)
    startTransition(() => choosePlan(planName, undefined, billingCycle));
  }

  function handlePhoneSubmit(phone: string | undefined) {
    if (!selectedPlan) return;
    startTransition(() => choosePlan(selectedPlan.name, phone, billingCycle));
  }

  const ordered = PLAN_ORDER.map((name) =>
    plans.find((p) => p.name === name),
  ).filter(Boolean) as Plan[];

  if (stage === "phone" && selectedPlan) {
    return (
      <div style={{ width: "100%", maxWidth: 1040 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 10,
              letterSpacing: "-0.02em",
            }}
          >
            Almost there
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--color-ink-secondary)" }}>
            Set up billing so we can activate your plan when the trial ends.
          </p>
        </div>

        <PhoneStep
          plan={selectedPlan}
          trialDays={trialDays}
          isPending={isPending}
          billingCycle={billingCycle}
          onBack={() => setStage("plans")}
          onSubmit={handlePhoneSubmit}
        />

        <p
          style={{
            textAlign: "center",
            fontSize: "0.8125rem",
            color: "#94a3b8",
            marginTop: 28,
          }}
        >
          Cancel any time · No charge during trial · M-Pesa confirmation
          required
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: 1040 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: 10,
            letterSpacing: "-0.02em",
          }}
        >
          Choose your plan
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "var(--color-ink-secondary)",
            maxWidth: 440,
            margin: "0 auto",
          }}
        >
          Start for free. Upgrade any time. No credit card needed today.
        </p>
      </div>

      {/* Annual / Monthly toggle */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "6px",
            borderRadius: 999,
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
          }}
        >
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            style={{
              padding: "8px 20px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.875rem",
              transition: "all 0.18s",
              background: billingCycle === "monthly" ? "white" : "transparent",
              color:
                billingCycle === "monthly"
                  ? "var(--color-ink-primary)"
                  : "var(--color-ink-tertiary)",
              boxShadow:
                billingCycle === "monthly"
                  ? "0 1px 4px rgba(0,0,0,0.1)"
                  : "none",
            }}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            style={{
              padding: "8px 20px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.875rem",
              transition: "all 0.18s",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: billingCycle === "annual" ? "white" : "transparent",
              color:
                billingCycle === "annual"
                  ? "var(--color-ink-primary)"
                  : "var(--color-ink-tertiary)",
              boxShadow:
                billingCycle === "annual"
                  ? "0 1px 4px rgba(0,0,0,0.1)"
                  : "none",
            }}
          >
            Annual
            <span
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 999,
                background: "var(--color-success-light)",
                color: "var(--color-success)",
              }}
            >
              Save 20%
            </span>
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 20,
          justifyContent: "center",
          alignItems: "stretch",
          flexWrap: "wrap",
        }}
      >
        {ordered.map((plan) => (
          <PlanCard
            key={plan.name}
            plan={plan}
            meta={planMeta[plan.name] ?? { subtitle: "", cta: "Choose plan" }}
            isPending={isPending}
            isAnnual={billingCycle === "annual"}
            onChoose={handleCardChoose}
          />
        ))}
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: "0.8125rem",
          color: "#94a3b8",
          marginTop: 36,
        }}
      >
        All plans include offline POS · Cancel or switch anytime
      </p>
    </div>
  );
}
