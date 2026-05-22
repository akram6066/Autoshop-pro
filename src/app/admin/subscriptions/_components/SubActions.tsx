"use client";

import { useTransition, useState } from "react";
import {
  grantFreeAccess,
  revokeAccess,
  extendTrial,
  activatePlan,
  extendSubscription,
} from "../_actions";
import { GrantFreeModal } from "./GrantFreeModal";
import { ActivatePlanModal } from "./ActivatePlanModal";
import { ExtendSubModal } from "./ExtendSubModal";
import { ExtendTrialModal } from "./ExtendTrialModal";

interface Props {
  userId: string;
  userName: string;
  status: string;
  isAdminOverride: boolean;
}

export function SubActions({
  userId,
  userName,
  status,
  isAdminOverride,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState<
    "grant" | "extend" | "activate" | "extendSub" | null
  >(null);
  const [notes, setNotes] = useState("");
  const [days, setDays] = useState(30);
  const [months, setMonths] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "ultra_pro">("pro");

  function handleGrant() {
    startTransition(async () => {
      await grantFreeAccess(userId, notes);
      setModal(null);
      setNotes("");
    });
  }

  function handleRevoke() {
    if (
      !confirm(
        `Revoke access for "${userName}"? Their plan will be set to Expired.`,
      )
    )
      return;
    startTransition(() => revokeAccess(userId));
  }

  function handleExtend() {
    startTransition(async () => {
      await extendTrial(userId, days);
      setModal(null);
    });
  }

  function handleActivate() {
    startTransition(async () => {
      await activatePlan(userId, selectedPlan, months);
      setModal(null);
    });
  }

  function handleExtendSub() {
    startTransition(async () => {
      await extendSubscription(userId, months);
      setModal(null);
    });
  }

  return (
    <>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {!isAdminOverride && (
          <button
            className="btn btn-sm"
            onClick={() => setModal("grant")}
            disabled={pending}
            style={{
              background: "var(--color-brand-50)",
              color: "var(--color-brand-600)",
              borderColor: "var(--color-brand-200)",
            }}
          >
            Grant Free
          </button>
        )}
        {status === "trial" && (
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setModal("extend")}
            disabled={pending}
          >
            Extend Trial
          </button>
        )}
        {!isAdminOverride && (
          <button
            className="btn btn-sm"
            onClick={() => {
              setMonths(1);
              setSelectedPlan("pro");
              setModal("activate");
            }}
            disabled={pending}
            style={{
              background: "#ede9fe",
              color: "#6d28d9",
              borderColor: "#c4b5fd",
            }}
          >
            Activate Plan
          </button>
        )}
        {status === "active" && !isAdminOverride && (
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => {
              setMonths(1);
              setModal("extendSub");
            }}
            disabled={pending}
          >
            Extend
          </button>
        )}
        {(isAdminOverride || status === "active") && (
          <button
            className="btn btn-sm"
            onClick={handleRevoke}
            disabled={pending}
            style={{
              background: "var(--color-danger-light)",
              color: "var(--color-danger)",
              borderColor: "#fca5a5",
            }}
          >
            Revoke
          </button>
        )}
      </div>

      {modal === "grant" && (
        <GrantFreeModal
          userName={userName}
          notes={notes}
          pending={pending}
          onNotesChange={setNotes}
          onCancel={() => setModal(null)}
          onGrant={handleGrant}
        />
      )}

      {modal === "activate" && (
        <ActivatePlanModal
          userName={userName}
          selectedPlan={selectedPlan}
          months={months}
          pending={pending}
          onPlanChange={setSelectedPlan}
          onMonthsChange={setMonths}
          onCancel={() => setModal(null)}
          onActivate={handleActivate}
        />
      )}

      {modal === "extendSub" && (
        <ExtendSubModal
          userName={userName}
          months={months}
          pending={pending}
          onMonthsChange={setMonths}
          onCancel={() => setModal(null)}
          onExtend={handleExtendSub}
        />
      )}

      {modal === "extend" && (
        <ExtendTrialModal
          userName={userName}
          days={days}
          pending={pending}
          onDaysChange={setDays}
          onCancel={() => setModal(null)}
          onExtend={handleExtend}
        />
      )}
    </>
  );
}
