"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  useAuthStore,
  selectShopId,
  selectShop,
  selectShops,
  selectUser,
} from "@/stores/authStore";
import type { Plan } from "@/lib/limits";
import type { Shop, ShopWithRole } from "@/types/app";
import { ShopForm } from "./_components/ShopForm";
import { RoomsSection } from "./_components/RoomsSection";
import { CategoriesSection } from "./_components/CategoriesSection";
import { TeamSection } from "./_components/TeamSection";

interface UsageCounts {
  products: number | null;
  staff: number | null;
  shops: number;
}

function StatRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div
      className="flex items-center justify-between py-1.5"
      style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
    >
      <span className="text-sm" style={{ color: "var(--color-ink-secondary)" }}>
        {label}
      </span>
      <span
        className="text-sm font-medium tabular-nums"
        style={{ color: "var(--color-ink-primary)" }}
      >
        {value === null ? "—" : value}
      </span>
    </div>
  );
}

function PlanUsageSection() {
  const shopId = useAuthStore(selectShopId);
  const shop = useAuthStore(selectShop);
  const shops = useAuthStore(selectShops);
  const [counts, setCounts] = useState<UsageCounts | null>(null);

  useEffect(() => {
    if (!shopId) return;
    const supabase = createClient();
    Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId),
      supabase
        .from("shop_members")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId),
    ]).then(([p, s]) => {
      setCounts({
        products: p.error ? null : (p.count ?? 0),
        staff: s.error ? null : (s.count ?? 0),
        shops: shops.length,
      });
    });
  }, [shopId, shops.length]);

  const plan: Plan = shop?.plan === "pro" ? "pro" : "free";

  return (
    <Section title="Plan & Usage">
      <div className="flex items-center justify-between mb-5">
        <span className="badge badge-neutral">
          {plan === "pro" ? "Pro Plan" : "Free Plan"}
        </span>
        <button className="btn btn-secondary btn-sm" disabled>
          Upgrade to Pro — coming soon
        </button>
      </div>
      {counts === null ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-6 rounded animate-pulse-soft"
              style={{ background: "var(--color-surface-2)" }}
            />
          ))}
        </div>
      ) : (
        <div>
          <StatRow label="Products" value={counts.products} />
          <StatRow label="Staff members" value={counts.staff} />
          <StatRow label="Shops" value={counts.shops} />
        </div>
      )}
      <p className="text-xs mt-4" style={{ color: "var(--color-ink-ghost)" }}>
        Paid plans coming soon
      </p>
    </Section>
  );
}

// ─── My Shops ─────────────────────────────────────────────────────────────────

function MyShopsSection() {
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
  const plan: Plan = shop?.plan === "pro" ? "pro" : "free";
  const atLimit = plan === "free" && ownerShops.length >= 1;
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

      {/* Inline create form */}
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
      ) : (
        <div className="mt-4">
          <button
            className="btn btn-secondary btn-sm"
            disabled={atLimit}
            title={atLimit ? "Upgrade to Pro to add more shops" : undefined}
            onClick={() => setShowForm(true)}
          >
            + Add new shop
          </button>
          {atLimit && (
            <p
              className="text-xs mt-1.5"
              style={{ color: "var(--color-ink-ghost)" }}
            >
              Upgrade to Pro to add more shops
            </p>
          )}
        </div>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
  danger = false,
}: {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className="card overflow-hidden mb-6 animate-fade-in-up"
      style={danger ? { borderColor: "var(--color-danger)" } : undefined}
    >
      <div
        className="px-5 py-4"
        style={{
          borderBottom: "1px solid var(--color-border)",
          ...(danger ? { background: "var(--color-danger-light)" } : {}),
        }}
      >
        <h2
          className="font-medium"
          style={danger ? { color: "var(--color-danger)" } : undefined}
        >
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const supabase = createClient();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = useCallback(async () => {
    setIsDeletingAccount(true);
    setDeleteMsg("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (err: unknown) {
      setDeleteMsg(
        (err as { message?: string })?.message ?? "Failed to delete account",
      );
      setIsDeletingAccount(false);
    }
  }, [supabase]);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold mb-1"
          style={{ color: "var(--color-ink-primary)" }}
        >
          Settings
        </h1>
        <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
          Manage your shop, rooms, categories and team
        </p>
      </div>

      <PlanUsageSection />
      <MyShopsSection />
      <Section title="Shop details">
        <ShopForm />
      </Section>
      <Section title="Product categories">
        <CategoriesSection />
      </Section>
      <Section title="Storage rooms">
        <RoomsSection />
      </Section>
      <Section title="Team">
        <TeamSection />
      </Section>

      <Section title="Danger zone" danger>
        <p
          className="text-sm mb-4"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          Permanently deletes your account, profile, and all associated data.
          This cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="btn btn-danger"
        >
          Delete Account
        </button>
      </Section>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
          style={{
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="rounded-xl w-full max-w-md overflow-hidden animate-fade-in-up p-6"
            style={{
              backgroundColor: "var(--color-surface-0)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-raised)",
            }}
          >
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: "var(--color-danger)" }}
            >
              Delete Account
            </h3>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              This will permanently delete your account and all your data. This
              cannot be undone. Are you absolutely sure?
            </p>

            {deleteMsg && (
              <p
                className="text-sm mb-4 p-3 rounded"
                style={{
                  backgroundColor: "var(--color-danger-light)",
                  color: "var(--color-danger-dark)",
                }}
              >
                {deleteMsg}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteMsg("");
                }}
                disabled={isDeletingAccount}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? "Deleting…" : "Yes, delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
