"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectUser, selectProfile } from "@/stores/authStore";
import { Section } from "../_components/Section";
import { friendlyError } from "@/lib/api/errors";

export default function AccountPage() {
  const supabase = createClient();
  const user = useAuthStore(selectUser);
  const profile = useAuthStore(selectProfile);
  const setProfile = useAuthStore((s) => s.setProfile);

  // ── Profile ───────────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !fullName.trim()) return;
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", user.id);
      if (error) throw error;
      if (profile) setProfile({ ...profile, full_name: fullName.trim() });
      setProfileMsg({ text: "Saved!", ok: true });
      setTimeout(() => setProfileMsg(null), 2500);
    } catch (err: unknown) {
      setProfileMsg({
        text: friendlyError(err, "Failed to save."),
        ok: false,
      });
    } finally {
      setProfileSaving(false);
    }
  }

  // ── Password ──────────────────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordMsg({
        text: "Password must be at least 8 characters.",
        ok: false,
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: "Passwords do not match.", ok: false });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg({ text: "Password updated successfully.", ok: true });
      setTimeout(() => setPasswordMsg(null), 3000);
    } catch (err: unknown) {
      setPasswordMsg({
        text: friendlyError(err, "Failed to update password."),
        ok: false,
      });
    } finally {
      setPasswordSaving(false);
    }
  }

  // ── Delete account ────────────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");

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
    <>
      {/* ── Profile ─────────────────────────────────────────────────────── */}
      <Section title="Profile">
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Full name
            </label>
            <input
              className="input"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setProfileMsg(null);
              }}
              placeholder="Your full name"
              maxLength={100}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              className="input"
              value={user?.email ?? ""}
              disabled
              style={{ opacity: 0.55, cursor: "not-allowed" }}
            />
            <p
              className="text-xs mt-1.5"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Email address cannot be changed.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={profileSaving || !fullName.trim()}
            >
              {profileSaving ? "Saving…" : "Save changes"}
            </button>
            {profileMsg && (
              <span
                className="text-sm"
                style={{
                  color: profileMsg.ok
                    ? "var(--color-success)"
                    : "var(--color-danger)",
                }}
              >
                {profileMsg.text}
              </span>
            )}
          </div>
        </form>
      </Section>

      {/* ── Security ────────────────────────────────────────────────────── */}
      <Section title="Security">
        <p
          className="text-sm mb-4"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          Change your login password. Choose something strong with at least 8
          characters.
        </p>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              New password
            </label>
            <input
              className="input"
              type="password"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordMsg(null);
              }}
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Confirm new password
            </label>
            <input
              className="input"
              type="password"
              placeholder="Repeat the new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordMsg(null);
              }}
              autoComplete="new-password"
            />
          </div>

          {passwordMsg && (
            <p
              className="text-sm"
              style={{
                color: passwordMsg.ok
                  ? "var(--color-success)"
                  : "var(--color-danger)",
              }}
            >
              {passwordMsg.text}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={passwordSaving || !newPassword || !confirmPassword}
          >
            {passwordSaving ? "Updating…" : "Update password"}
          </button>
        </form>
      </Section>

      {/* ── Danger zone ─────────────────────────────────────────────────── */}
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
          Delete account
        </button>
      </Section>

      {/* Delete confirm modal */}
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
    </>
  );
}
