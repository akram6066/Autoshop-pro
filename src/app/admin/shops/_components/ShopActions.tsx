"use client";

import { useTransition, useState } from "react";
import { updateShop, deleteShop } from "../_actions";
import { EditShopModal } from "./EditShopModal";
import { DeleteShopModal } from "./DeleteShopModal";

type Modal = "edit" | "delete" | null;

interface Props {
  shopId: string;
  shopName: string;
  shopAddress: string;
}

export function ShopActions({ shopId, shopName, shopAddress }: Props) {
  const [modal, setModal] = useState<Modal>(null);
  const [name, setName] = useState(shopName);
  const [address, setAddress] = useState(shopAddress);
  const [pending, startTransition] = useTransition();

  function openEdit() {
    setName(shopName);
    setAddress(shopAddress);
    setModal("edit");
  }

  function handleSave() {
    if (!name.trim()) return;
    startTransition(async () => {
      await updateShop(shopId, name, address);
      setModal(null);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteShop(shopId);
      setModal(null);
    });
  }

  return (
    <>
      {/* Row action buttons */}
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn btn-sm btn-secondary" onClick={openEdit}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
            <path
              d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Edit
        </button>
        <button
          className="btn btn-sm"
          onClick={() => setModal("delete")}
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
          Delete
        </button>
      </div>

      {modal === "edit" && (
        <EditShopModal
          shopName={shopName}
          name={name}
          address={address}
          pending={pending}
          onNameChange={setName}
          onAddressChange={setAddress}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "delete" && (
        <DeleteShopModal
          shopName={shopName}
          pending={pending}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
