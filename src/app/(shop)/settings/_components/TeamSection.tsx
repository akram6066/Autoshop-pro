"use client";
import { useState } from "react";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useTeam, useAddStaff, useRemoveStaff } from "@/hooks/useTeam";

export function TeamSection() {
  const shopId = useAuthStore(selectShopId);
  const { data: teamMembers = [], isError: teamError } = useTeam(shopId);
  const addStaff = useAddStaff();
  const removeStaff = useRemoveStaff();
  const [staffEmail, setStaffEmail] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!staffEmail.trim() || !staffPassword.trim() || !staffName.trim() || !shopId) return;
    setMsg(""); setIsAdding(true);
    try {
      await addStaff(shopId, staffEmail, staffPassword, staffName);
      setMsg("Staff account created successfully.");
      setStaffEmail(""); setStaffPassword(""); setStaffName("");
      setTimeout(() => setMsg(""), 4000);
    } catch (err: unknown) {
      setMsg((err as { message?: string })?.message ?? "Failed to create staff account");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemove(userId: string) {
    if (!shopId) return;
    setMsg("");
    try {
      await removeStaff(shopId, userId);
    } catch (err: unknown) {
      setMsg((err as { message?: string })?.message ?? "Failed to remove staff");
    }
  }

  return (
    <>
      {teamError ? (
        <p className="text-sm mb-4" style={{ color: "var(--color-danger)" }}>
          Could not load team. Run the latest migration and try again.
        </p>
      ) : teamMembers.length === 0 ? (
        <p className="text-sm mb-4" style={{ color: "var(--color-ink-tertiary)" }}>No team members yet.</p>
      ) : (
        <div className="mb-5">
          {teamMembers.map((member) => (
            <div key={member.user_id} className="flex items-center justify-between py-3"
              style={{ borderBottom: "1px solid oklch(94% 0.003 250)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                  style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
                  {member.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.full_name || "—"}</p>
                  <span className={`badge ${member.role === "owner" ? "badge-info" : "badge-neutral"} mt-0.5`}>
                    {member.role}
                  </span>
                </div>
              </div>
              {member.role !== "owner" && (
                <button onClick={() => handleRemove(member.user_id)}
                  className="btn btn-ghost btn-sm" style={{ color: "var(--color-danger)" }}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="pt-4" style={{ borderTop: teamMembers.length > 0 ? "1px solid oklch(91% 0.004 250)" : "none" }}>
        <p className="text-sm font-medium mb-3">Create staff account</p>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-ink-secondary)" }}>Full name</label>
            <input className="input" type="text" placeholder="e.g. John Kamau"
              value={staffName} onChange={(e) => setStaffName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-ink-secondary)" }}>Email</label>
            <input className="input" type="email" placeholder="staff@email.com"
              value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-ink-secondary)" }}>Password</label>
            <input className="input" type="password" placeholder="Min. 6 characters"
              value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} minLength={6} required />
          </div>
          <button type="submit" className="btn btn-primary w-full"
            disabled={!staffEmail.trim() || !staffPassword.trim() || !staffName.trim() || isAdding}>
            {isAdding ? "Creating account…" : "Create staff account"}
          </button>
        </form>
        {msg && (
          <p className="text-sm mt-2"
            style={{ color: msg.startsWith("Staff account created") ? "var(--color-success)" : "var(--color-danger)" }}>
            {msg}
          </p>
        )}
      </div>
    </>
  );
}