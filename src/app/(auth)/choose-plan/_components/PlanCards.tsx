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
}: {
  plans: Plan[];
  trialEnabled: boolean;
  trialDays: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [stage, setStage] = useState<"plans" | "phone">("plans");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const planMeta = buildPlanMeta(trialEnabled, trialDays);

  function handleCardChoose(planName: string) {
    const plan = plans.find((p) => p.name === planName);
    if (!plan) return;

    // Free plan: skip phone collection
    if (planName === "trial" || plan.price_kes === 0) {
      startTransition(() => choosePlan(planName));
      return;
    }

    // Paid trial: collect M-Pesa number first
    if (trialEnabled) {
      setSelectedPlan(plan);
      setStage("phone");
      return;
    }

    // Trial disabled (e.g. direct purchase)
    startTransition(() => choosePlan(planName));
  }

  function handlePhoneSubmit(phone: string | undefined) {
    if (!selectedPlan) return;
    startTransition(() => choosePlan(selectedPlan.name, phone));
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
      <div style={{ textAlign: "center", marginBottom: 48 }}>
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
