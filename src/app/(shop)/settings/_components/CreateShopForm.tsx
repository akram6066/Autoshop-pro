"use client";
import { useState, useTransition } from "react";
import { useMounted } from "@/hooks/useMounted";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectUser, selectShops } from "@/stores/authStore";
import { shopSchema } from "@/lib/validations/domain";
import { friendlyError } from "@/lib/api/errors";
import type { Shop, ShopWithRole } from "@/types/app";

export function CreateShopForm() {
  const supabase = createClient();
  const user = useAuthStore(selectUser);
  const shops = useAuthStore(selectShops);
  const setShops = useAuthStore((s) => s.setShops);
  const switchShop = useAuthStore((s) => s.switchShop);
  const [isPending, startTransition] = useTransition();
  const mounted = useMounted();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setMsg("");

    const parsed = shopSchema.safeParse({ name, address });
    if (!parsed.success) {
      setMsg(parsed.error.issues[0].message);
      return;
    }

    startTransition(async () => {
      const { data: shop, error: shopError } = await supabase
        .from("shops")
        .insert({
          name: parsed.data.name,
          address: parsed.data.address ?? null,
        })
        .select()
        .single();

      if (shopError) {
        setMsg(friendlyError(shopError));
        return;
      }

      const { error: memberError } = await supabase
        .from("shop_members")
        .insert({ shop_id: shop.id, user_id: user.id, role: "owner" });

      if (memberError) {
        setMsg(friendlyError(memberError));
        return;
      }

      const newShop: ShopWithRole = { ...(shop as Shop), role: "owner" };
      setShops([...shops, newShop]);
      await switchShop(newShop);
      setName("");
      setAddress("");
      setMsg("Created!");
      setTimeout(() => setMsg(""), 2000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">Shop name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Main Branch"
          maxLength={200}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Address</label>
        <input
          className="input"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Optional"
          maxLength={500}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={!mounted || isPending || !user}
        >
          {isPending ? "Creating…" : "Create shop"}
        </button>
        {msg && (
          <span
            className="text-sm"
            style={{
              color:
                msg === "Created!"
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
