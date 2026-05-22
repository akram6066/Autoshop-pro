"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
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
import { ShopForm } from "./_components/ShopForm";
import { RoomsSection } from "./_components/RoomsSection";
import { CategoriesSection } from "./_components/CategoriesSection";
import { TeamSection } from "./_components/TeamSection";

// ─── Subscription types ────────────────────────────────────────────────────────

interface SubPlan {
  name: string;
  displayName: string;
  priceKes: number;
  maxShops: number;
  maxProductsPerShop: number;
  maxStaffPerShop: number;
  maxSalesPerMonth: number;
}

interface SubInfo {
  status: string;
  isActive: boolean;
  daysLeft: number;
  isAdminOverride: boolean;
  plan: SubPlan;
}

// ─── Small helpers ────────────────────────────────────────────────────────────

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

function UsageBar({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number;
}) {
  const unlimited = max >= 999999;
  const pct = unlimited ? 0 : Math.min(100, Math.round((current / max) * 100));
  const over = !unlimited && current >= max;
  const warn = !unlimited && pct >= 80;
  const barColor = over
    ? "var(--color-danger)"
    : warn
      ? "var(--color-warning)"
      : "var(--color-brand-500)";

  return (
    <div style={{ marginBottom: 14 }}>
      <div className="flex justify-between mb-1">
        <span
          className="text-xs font-medium"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          {label}
        </span>
        <span
          className="text-xs font-semibold tabular-nums"
          style={{
            color: over ? "var(--color-danger)" : "var(--color-ink-tertiary)",
          }}
        >
          {unlimited ? `${current} / ∞` : `${current} / ${max}`}
        </span>
      </div>
      {!unlimited && (
        <div
          style={{
            height: 5,
            borderRadius: 99,
            background: "var(--color-surface-2)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              borderRadius: 99,
              background: barColor,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Plan & Usage ─────────────────────────────────────────────────────────────

function PlanUsageSection({
  sub,
  subLoading,
  ownedShopCount,
  shopId,
}: {
  sub: SubInfo | null;
  subLoading: boolean;
  ownedShopCount: number;
  shopId: string | null;
}) {
  const [products, setProducts] = useState<number | null>(null);
  const [staff, setStaff] = useState<number | null>(null);
  const [sales, setSales] = useState<number | null>(null);

  useEffect(() => {
    if (!shopId) return;
    const supabase = createClient();
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).toISOString();

    Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId),
      supabase
        .from("shop_members")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId)
        .eq("role", "staff"),
      supabase
        .from("sales")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId)
        .gte("created_at", monthStart),
    ]).then(([p, s, sl]) => {
      setProducts(p.count ?? 0);
      setStaff(s.count ?? 0);
      setSales(sl.count ?? 0);
    });
  }, [shopId]);

  // Status badge config
  const badgeCfg: Record<
    string,
    { label: string; bg: string; color: string; dot: string }
  > = {
    trial: {
      label: "Free",
      bg: "#fef9c3",
      color: "#a16207",
      dot: "#d97706",
    },
    active: { label: "Pro", bg: "#ede9fe", color: "#7c3aed", dot: "#7c3aed" },
    free: { label: "Free", bg: "#dbeafe", color: "#1d4ed8", dot: "#2563eb" },
    expired: {
      label: "Expired",
      bg: "#fee2e2",
      color: "#dc2626",
      dot: "#dc2626",
    },
    cancelled: {
      label: "Cancelled",
      bg: "#f1f5f9",
      color: "#64748b",
      dot: "#94a3b8",
    },
  };

  const isPro =
    sub?.status === "active" || sub?.isAdminOverride || sub?.status === "free";
  const badge = sub ? (badgeCfg[sub.status] ?? badgeCfg.expired) : null;

  return (
    <Section title="Plan & Usage">
      {subLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-5 rounded animate-pulse-soft"
              style={{ background: "var(--color-surface-2)" }}
            />
          ))}
        </div>
      ) : !sub ? (
        <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
          No subscription found.{" "}
          <Link href="/billing" style={{ color: "var(--color-brand-600)" }}>
            Set up billing →
          </Link>
        </p>
      ) : (
        <>
          {/* Plan header */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {badge && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    background: badge.bg,
                    color: badge.color,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: badge.dot,
                      display: "inline-block",
                    }}
                  />
                  {sub.isAdminOverride ? "Free (Admin)" : badge.label}
                </span>
              )}
              {sub.status === "trial" &&
                sub.isActive &&
                sub.daysLeft < 9999 && (
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-ink-tertiary)" }}
                  >
                    {sub.daysLeft} day{sub.daysLeft !== 1 ? "s" : ""} remaining
                  </span>
                )}
              {!sub.isActive && (
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--color-danger)" }}
                >
                  Access restricted
                </span>
              )}
            </div>
            {!isPro && (
              <Link href="/billing" className="btn btn-primary btn-sm">
                Upgrade to Pro — KES 1,000/mo
              </Link>
            )}
            {isPro && !sub.isAdminOverride && (
              <Link href="/billing" className="btn btn-secondary btn-sm">
                Manage billing →
              </Link>
            )}
          </div>

          {/* Usage bars */}
          <div
            style={{
              borderTop: "1px solid var(--color-border-subtle)",
              paddingTop: 16,
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Usage — active shop
            </p>
            <UsageBar
              label="Shops owned"
              current={ownedShopCount}
              max={sub.plan.maxShops}
            />
            <UsageBar
              label="Products"
              current={products ?? 0}
              max={sub.plan.maxProductsPerShop}
            />
            <UsageBar
              label="Staff members"
              current={staff ?? 0}
              max={sub.plan.maxStaffPerShop}
            />
            <UsageBar
              label="Sales this month"
              current={sales ?? 0}
              max={sub.plan.maxSalesPerMonth}
            />
          </div>
        </>
      )}
    </Section>
  );
}

// ─── My Shops ─────────────────────────────────────────────────────────────────

function MyShopsSection({ sub }: { sub: SubInfo | null }) {
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
            href="/billing"
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const supabase = createClient();
  const shopId = useAuthStore(selectShopId);
  const shops = useAuthStore(selectShops);

  const [sub, setSub] = useState<SubInfo | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const ownedShopCount = shops.filter((s) => s.role === "owner").length;

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setSub(data as SubInfo);
      })
      .finally(() => setSubLoading(false));
  }, []);

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
          Manage your shop, plan, team and account
        </p>
      </div>

      <PlanUsageSection
        sub={sub}
        subLoading={subLoading}
        ownedShopCount={ownedShopCount}
        shopId={shopId}
      />
      <MyShopsSection sub={sub} />
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
        <TeamSection maxStaff={sub?.plan.maxStaffPerShop ?? 2} />
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
