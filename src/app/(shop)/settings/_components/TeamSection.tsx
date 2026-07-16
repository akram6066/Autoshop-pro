"use client";
import { useState } from "react";
import Link from "next/link";
import {
  useAuthStore,
  selectShopId,
  selectUser,
  selectProfile,
} from "@/stores/authStore";
import {
  useTeam,
  useAddStaff,
  useResetStaffPassword,
  useDeleteStaff,
} from "@/hooks/useTeam";
import type { TeamMember } from "@/types/app";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Users, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { friendlyError } from "@/lib/api/errors";

export function TeamSection({ maxStaff }: { maxStaff: number }) {
  const shopId = useAuthStore(selectShopId);
  const currentUser = useAuthStore(selectUser);
  const currentProfile = useAuthStore(selectProfile);
  const {
    data: teamMembers = [],
    isError: teamError,
    isLoading: teamLoading,
  } = useTeam(shopId);

  const addStaff = useAddStaff();
  const resetStaffPassword = useResetStaffPassword();
  const deleteStaff = useDeleteStaff();

  const [staffEmail, setStaffEmail] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Limit checks (count only actual staff, not owner)
  const staffCount = teamMembers.filter((m) => m.role === "staff").length;
  const unlimited = maxStaff >= 999999;
  const atLimit = !unlimited && staffCount >= maxStaff;
  const nearLimit = !unlimited && !atLimit && staffCount / maxStaff >= 0.8;

  // Management Modal State
  const [managingMember, setManagingMember] = useState<TeamMember | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isManaging, setIsManaging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (
      !staffEmail.trim() ||
      !staffPassword.trim() ||
      !staffName.trim() ||
      !shopId
    )
      return;
    setIsAdding(true);
    try {
      await addStaff(shopId, staffEmail, staffPassword, staffName);
      toast.success("Staff account created successfully.");
      setStaffEmail("");
      setStaffPassword("");
      setStaffName("");
    } catch (err: unknown) {
      toast.error(friendlyError(err, "Failed to create staff account."));
    } finally {
      setIsAdding(false);
    }
  }

  async function handleResetPassword() {
    if (!shopId || !managingMember || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setIsManaging(true);
    try {
      await resetStaffPassword(shopId, managingMember.user_id, newPassword);
      toast.success("Password reset successfully.");
      setNewPassword("");
    } catch (err: unknown) {
      toast.error(friendlyError(err, "Failed to reset password."));
    } finally {
      setIsManaging(false);
    }
  }

  async function handleDeleteAccount() {
    if (!shopId || !managingMember) return;

    setIsManaging(true);
    try {
      await deleteStaff(shopId, managingMember.user_id);
      toast.success("Account deleted successfully.");
      setManagingMember(null);
      setShowDeleteConfirm(false);
    } catch (err: unknown) {
      toast.error(friendlyError(err, "Failed to delete account."));
    } finally {
      setIsManaging(false);
    }
  }

  return (
    <>
      {teamLoading ? (
        <div className="mb-5 space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : teamError ? (
        <p className="text-sm mb-4" style={{ color: "var(--color-danger)" }}>
          Could not load team. Run the latest migration and try again.
        </p>
      ) : teamMembers.length === 0 ? (
        <div className="mb-6">
          <EmptyState
            icon={Users}
            title="No team members yet"
            description="Invite staff to help manage your shop. They will have access to everything except settings and team management."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 mb-5">
          {teamMembers.map((member) => {
            const isCurrentUser = member.user_id === currentUser?.id;
            // Owner row: full_name from RPC may be empty — fall back to store profile
            // then email so the row never shows "?" or "—"
            const resolvedName =
              member.full_name?.trim() ||
              (isCurrentUser
                ? currentProfile?.full_name?.trim() || currentUser?.email
                : null) ||
              "Unknown";
            const avatarLetter = resolvedName.charAt(0).toUpperCase();

            return (
              <div
                key={member.user_id}
                className="flex items-center justify-between py-3"
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                    style={{
                      background:
                        member.role === "owner"
                          ? "var(--color-brand-100)"
                          : "var(--color-surface-2)",
                      color:
                        member.role === "owner"
                          ? "var(--color-brand-700)"
                          : "var(--color-ink-secondary)",
                    }}
                  >
                    {avatarLetter}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {resolvedName}
                      {isCurrentUser && (
                        <span
                          className="ml-1.5 text-xs font-normal"
                          style={{ color: "var(--color-ink-tertiary)" }}
                        >
                          (you)
                        </span>
                      )}
                    </p>
                    <span
                      className={`badge ${member.role === "owner" ? "badge-info" : "badge-neutral"} mt-0.5`}
                    >
                      {member.role}
                    </span>
                  </div>
                </div>
                {member.role !== "owner" && (
                  <button
                    type="button"
                    onClick={() => setManagingMember(member)}
                    className="btn btn-secondary btn-sm"
                  >
                    Manage
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Management */}
      <Modal
        isOpen={!!managingMember}
        onClose={() => {
          setManagingMember(null);
          setShowDeleteConfirm(false);
        }}
        title={`Manage ${managingMember?.full_name?.trim() || "staff member"}`}
      >
        {managingMember && (
          <div className="space-y-6">
            {/* Reset Password */}
            <div
              className="p-4 rounded-lg border"
              style={{
                borderColor: "var(--color-border-subtle)",
                background: "var(--color-surface-1)",
              }}
            >
              <h4 className="text-sm font-medium mb-1">Reset Password</h4>
              <p
                className="text-xs mb-3"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                Set a new password for this staff member. They will use this to
                log in.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  className="input text-sm w-full sm:flex-1"
                  placeholder="New password (min 8 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isManaging || newPassword.length < 8}
                  className="btn btn-primary btn-sm w-full sm:w-auto whitespace-nowrap"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div
              className="p-4 rounded-lg border"
              style={{
                borderColor: "var(--color-danger)",
                background: "var(--color-danger-light)",
              }}
            >
              <h4
                className="text-sm font-medium mb-1"
                style={{ color: "var(--color-danger-dark)" }}
              >
                Danger Zone
              </h4>

              {!showDeleteConfirm ? (
                <div className="flex items-center justify-between mt-3">
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-danger-text)" }}
                  >
                    Delete this staff account permanently
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn btn-danger btn-sm"
                    disabled={isManaging}
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--color-danger-text)" }}
                  >
                    Delete <strong>{managingMember.full_name}</strong>? This
                    cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="btn btn-secondary btn-sm flex-1"
                      disabled={isManaging}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="btn btn-danger btn-sm flex-1"
                      disabled={isManaging}
                    >
                      {isManaging ? "Deleting…" : "Yes, delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Staff Section */}
      <div
        className="pt-4 mt-2"
        style={{
          borderTop:
            teamMembers.length > 0 ? "1px solid var(--color-border)" : "none",
        }}
      >
        {atLimit ? (
          /* Limit reached — show upgrade prompt */
          <div
            className="flex items-start gap-3 p-3 rounded-lg"
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
            }}
          >
            <AlertTriangle
              size={16}
              style={{
                color: "var(--color-warning)",
                flexShrink: 0,
                marginTop: 2,
              }}
            />
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-ink-primary)" }}
              >
                Staff limit reached ({staffCount} / {maxStaff})
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                Upgrade your plan to add more staff accounts.
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
          <>
            {nearLimit && (
              <div
                className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-xs font-medium"
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fcd34d",
                  color: "#92400e",
                }}
              >
                <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                {staffCount} of {maxStaff} staff slots used — approaching limit.{" "}
                <Link
                  href="/billing"
                  style={{ color: "#7c3aed", textDecoration: "underline" }}
                >
                  Upgrade
                </Link>
              </div>
            )}
            <p className="text-sm font-medium mb-3">Create staff account</p>
            <form onSubmit={handleAdd}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: "var(--color-ink-secondary)" }}
                  >
                    Full name
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. John Kamau"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: "var(--color-ink-secondary)" }}
                  >
                    Email
                  </label>
                  <input
                    className="input"
                    type="email"
                    placeholder="staff@email.com"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: "var(--color-ink-secondary)" }}
                  >
                    Password
                  </label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  !staffEmail.trim() ||
                  staffPassword.length < 8 ||
                  !staffName.trim() ||
                  isAdding
                }
              >
                {isAdding ? "Creating account…" : "Create staff account"}
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}


