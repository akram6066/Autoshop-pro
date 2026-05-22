"use client";

import { useTransition, useState } from "react";
import { restoreShop, permanentlyDeleteShop } from "../_actions";
import { RestoreModal } from "./RestoreModal";
import { DestroyModal } from "./DestroyModal";

export function RestoreShopButton({
  shopId,
  shopName,
}: {
  shopId: string;
  shopName: string;
}) {
  const [modal, setModal] = useState<"restore" | "destroy" | null>(null);
  const [pending, startTransition] = useTransition();

  function handleRestore() {
    startTransition(async () => {
      await restoreShop(shopId);
      setModal(null);
    });
  }

  function handleDestroy() {
    startTransition(async () => {
      await permanentlyDeleteShop(shopId);
      setModal(null);
    });
  }

  return (
    <>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          className="btn btn-sm"
          onClick={() => setModal("restore")}
          disabled={pending}
          style={{
            background: "#dcfce7",
            color: "#15803d",
            borderColor: "#86efac",
          }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
            <path
              d="M1 4v6h6M23 20v-6h-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Restore
        </button>
        <button
          className="btn btn-sm"
          onClick={() => setModal("destroy")}
          disabled={pending}
          style={{
            background: "#fee2e2",
            color: "#dc2626",
            borderColor: "#fca5a5",
          }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
            <path
              d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Delete Forever
        </button>
      </div>

      {modal === "restore" && (
        <RestoreModal
          shopName={shopName}
          pending={pending}
          onRestore={handleRestore}
          onClose={() => !pending && setModal(null)}
        />
      )}

      {modal === "destroy" && (
        <DestroyModal
          shopName={shopName}
          pending={pending}
          onDestroy={handleDestroy}
          onClose={() => !pending && setModal(null)}
        />
      )}
    </>
  );
}
