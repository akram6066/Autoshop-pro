"use client";

import { useState } from "react";
import Link from "next/link";
import { useInvites } from "@/hooks/useTeam";

export function PendingInviteBanner() {
  const { data: invites = [] } = useInvites();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || invites.length === 0) return null;

  return (
    <div
      style={{
        background: "var(--color-brand-50, #eff6ff)",
        borderBottom: "1px solid var(--color-brand-200, #bfdbfe)",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        fontSize: "0.875rem",
      }}
    >
      <span style={{ color: "var(--color-brand-700, #1d4ed8)" }}>
        You have{" "}
        <strong>
          {invites.length} pending shop invite{invites.length !== 1 ? "s" : ""}
        </strong>
        .
      </span>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Link
          href="/invites"
          className="btn btn-primary btn-sm"
          style={{ whiteSpace: "nowrap" }}
        >
          View invites
        </Link>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
