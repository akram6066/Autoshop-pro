"use client";
import { useState, useTransition } from "react";
import { useMounted } from "@/hooks/useMounted";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectShop, selectShopId } from "@/stores/authStore";
import type { Shop } from "@/types/app";

export function ShopForm() {
  const supabase = createClient();
  const shop = useAuthStore(selectShop);
  const shopId = useAuthStore(selectShopId);
  const setShop = useAuthStore((s) => s.setShop);
  const [isPending, startTransition] = useTransition();
  const mounted = useMounted();
  const [shopName, setShopName] = useState(shop?.name ?? "");
  const [shopAddress, setShopAddress] = useState(shop?.address ?? "");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId || !shopName.trim()) return;
    setMsg("");
    startTransition(async () => {
      const { data, error } = await supabase
        .from("shops")
        .update({ name: shopName.trim(), address: shopAddress.trim() || null })
        .eq("id", shopId)
        .select()
        .single();
      if (error) {
        setMsg(error.message);
        return;
      }
      setShop(data as Shop);
      setMsg("Saved!");
      setTimeout(() => setMsg(""), 2000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">Shop name</label>
        <input
          className="input"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Address</label>
        <input
          className="input"
          value={shopAddress}
          onChange={(e) => setShopAddress(e.target.value)}
          placeholder="Optional"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={!mounted || isPending}
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        {msg && (
          <span
            className="text-sm"
            style={{
              color:
                msg === "Saved!"
                  ? "var(--color-success)"
                  : "var(--color-danger)",
            }}
          >
            {msg}
          </span>
        )}
      </div>
    </form>
  );
}
