"use client";
import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShopForm } from "./_components/ShopForm";
import { RoomsSection } from "./_components/RoomsSection";
import { CategoriesSection } from "./_components/CategoriesSection";
import { TeamSection } from "./_components/TeamSection";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden mb-6 animate-fade-in-up">
      <div className="px-5 py-4" style={{ borderBottom: "1px solid oklch(91% 0.004 250)" }}>
        <h2 className="font-medium">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const supabase = createClient();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");

  const handleDeleteAccount = useCallback(async () => {
    if (!window.confirm(
      "This will permanently delete your account and all your data. This cannot be undone.\n\nType OK to confirm."
    )) return;
    setIsDeletingAccount(true);
    setDeleteMsg("");
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (err: unknown) {
      setDeleteMsg((err as { message?: string })?.message ?? "Failed to delete account");
      setIsDeletingAccount(false);
    }
  }, [supabase]);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl mb-1" style={{ color: "var(--color-ink-primary)" }}>Settings</h1>
        <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
          Manage your shop, rooms, categories and team
        </p>
      </div>

      <Section title="Shop details"><ShopForm /></Section>
      <Section title="Product categories"><CategoriesSection /></Section>
      <Section title="Storage rooms"><RoomsSection /></Section>
      <Section title="Team"><TeamSection /></Section>

      <Section title="Danger zone">
        <p className="text-sm mb-4" style={{ color: "var(--color-ink-secondary)" }}>
          Permanently deletes your account, profile, and all associated data. This cannot be undone.
        </p>
        <button onClick={handleDeleteAccount} className="btn btn-danger" disabled={isDeletingAccount}>
          {isDeletingAccount ? "Deleting…" : "Delete Account"}
        </button>
        {deleteMsg && <p className="text-sm mt-3" style={{ color: "var(--color-danger)" }}>{deleteMsg}</p>}
      </Section>
    </div>
  );
}