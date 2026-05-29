"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectShopId, selectShops } from "@/stores/authStore";
import { ShopForm } from "./_components/ShopForm";
import { RoomsSection } from "./_components/RoomsSection";
import { CategoriesSection } from "./_components/CategoriesSection";
import { TeamSection } from "./_components/TeamSection";
import { Section } from "./_components/Section";
import { PlanUsageSection } from "./_components/PlanUsageSection";
import { MyShopsSection } from "./_components/MyShopsSection";
import type { SubInfo } from "./_components/PlanUsageSection";

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
    <div className="w-full max-w-2xl">
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
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                className="btn btn-secondary w-full sm:w-auto"
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
                className="btn btn-danger w-full sm:w-auto"
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
