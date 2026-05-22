"use client";

import { useTransition } from "react";
import { deleteUser } from "../_actions";

export function DeleteUserButton({
  userId,
  userName,
  isSelf,
}: {
  userId: string;
  userName: string;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (isSelf) {
    return <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>You</span>;
  }

  function handleDelete() {
    if (!confirm(`Delete "${userName}"? This cannot be undone.`)) return;
    startTransition(() => deleteUser(userId));
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      style={{
        padding: "5px 12px",
        borderRadius: 6,
        fontSize: "0.8125rem",
        fontWeight: 600,
        background: pending ? "#f1f5f9" : "#fee2e2",
        color: pending ? "#94a3b8" : "#dc2626",
        border: "1px solid",
        borderColor: pending ? "#e2e8f0" : "#fca5a5",
        cursor: pending ? "not-allowed" : "pointer",
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
