"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  useAuthStore,
  selectShopId,
  selectShop,
  selectShops,
  selectUser,
} from "@/stores/authStore";
import type { Shop, ShopWithRole } from "@/types/app";
import { Section } from "./Section";
import type { SubInfo } from "./PlanUsageSection";

export function MyShopsSection({ sub }: { sub: SubInfo | null }) {
  const shopId = useAuthStore(selectShopId);
  const shop = useAuthStore(selectShop);
  const shops = useAuthStore(selectShops);
  const user = useAuthStore(selectUser);
  const switchShopFn = useAuthStore((s) => s.switchShop);
  const setShops = useAuthStore((s) => s.setShops);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState("");

  const ownerShops = shops.filter((s) => s.role === "owner");
  const maxShops = sub?.plan.maxShops ?? 1;
  const atLimit = ownerShops.length >= maxShops;
  const isLoaded = shopId !== null;

  function resetForm() {
    setName("");
    setAddress("");
    setFormError("");
    setShowForm(false);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;

    // Client-side limit check before hitting DB
    if (atLimit) {
      setFormError(
        `Your plan allows up to ${maxShops} shop${maxShops !== 1 ? "s" : ""}. Upgrade to add more.`,
      );
      return;
    }

    setFormError("");
    startTransition(async () => {
      const supabase = createClient();
      const { data: newShop, error: shopError } = await supabase
        .from("shops")
        .insert({ name: name.trim(), address: address.trim() || null })
        .select()
        .single();

      if (shopError) {
        setFormError(
          shopError.code === "23505"
            ? "A shop with that name already exists."
            : shopError.message,
        );
        return;
      }

      const { error: memberError } = await supabase
        .from("shop_members")
        .insert({ shop_id: newShop.id, user_id: user.id, role: "owner" });

      if (memberError) {
        setFormError(memberError.message);
        return;
      }

      const created: ShopWithRole = { ...(newShop as Shop), role: "owner" };
      setShops([...shops, created]);
      await switchShopFn(created);
      resetForm();
    });
  }

  return (
    <Section title="My Shops">
      {!isLoaded ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-12 rounded-lg animate-pulse-soft"
              style={{ background: "var(--color-surface-2)" }}
            />
          ))}
        </div>
      ) : (
        <div>
          {ownerShops.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
            >
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--color-ink-primary)" }}
                >
                  {s.name}
                </p>
                {s.address && (
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--color-ink-tertiary)" }}
                  >
                    {s.address}
                  </p>
                )}
              </div>
              {s.id === shop?.id ? (
                <span className="badge badge-info">Active</span>
              ) : (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => switchShopFn(s)}
                >
                  Switch
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add shop */}
      {showForm ? (
        <form onSubmit={handleCreate} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Shop name
            </label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Branch"
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
            />
          </div>
          {formError && (
            <p className="text-sm" style={{ color: "var(--color-danger)" }}>
              {formError}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isPending}
            >
              {isPending ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={resetForm}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : atLimit ? (
        /* Limit reached — show upgrade prompt */
        <div
          className="mt-4 flex items-center justify-between gap-4 p-3 rounded-lg"
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-ink-primary)" }}
            >
              Shop limit reached
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Your plan allows {maxShops} shop{maxShops !== 1 ? "s" : ""}.
              Upgrade to add more.
            </p>
          </div>
          <Link
            href="/billing?plan=pro"
            className="btn btn-primary btn-sm"
            style={{ whiteSpace: "nowrap" }}
          >
            Upgrade
          </Link>
        </div>
      ) : (
        <div className="mt-4">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowForm(true)}
          >
            + Add new shop
          </button>
          {sub && (
            <p
              className="text-xs mt-1.5"
              style={{ color: "var(--color-ink-ghost)" }}
            >
              {ownerShops.length} of{" "}
              {maxShops >= 999999 ? "unlimited" : maxShops} shops used
            </p>
          )}
        </div>
      )}
    </Section>
  );
}
