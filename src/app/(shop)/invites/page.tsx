"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useInvites, useAcceptInvite, useRejectInvite } from "@/hooks/useTeam";
import { formatDate } from "@/lib/utils";

export default function InvitesPage() {
  const router = useRouter();
  const { data: invites = [], isLoading } = useInvites();
  const acceptInvite = useAcceptInvite();
  const rejectInvite = useRejectInvite();
  const [busy, setBusy] = useState<string | null>(null);

  async function handleAccept(inviteId: string) {
    setBusy(inviteId);
    try {
      await acceptInvite(inviteId);
      toast.success("You've joined the shop!");
      // Full page navigation (not router.replace) so the (shop) layout's
      // init() re-runs and refetches shop_members — otherwise the new shop
      // stays invisible in the switcher until the user manually reloads.
      window.location.assign("/dashboard");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not accept invite",
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleReject(inviteId: string) {
    setBusy(inviteId);
    try {
      await rejectInvite(inviteId);
      toast.success("Invite declined.");
    } catch {
      toast.error("Could not decline invite");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 16px" }}>
      <h1
        className="font-display text-2xl mb-2"
        style={{ color: "var(--color-ink-primary)" }}
      >
        Shop Invitations
      </h1>
      <p
        className="text-sm mb-8"
        style={{ color: "var(--color-ink-secondary)" }}
      >
        Accept an invite to join a shop as a staff member or co-owner.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl animate-pulse-soft"
              style={{ background: "var(--color-surface-2)" }}
            />
          ))}
        </div>
      ) : invites.length === 0 ? (
        <div
          className="card text-center py-12"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          <p className="text-sm">No pending invitations.</p>
          <button
            className="btn btn-secondary btn-sm mt-4"
            onClick={() => router.back()}
          >
            Go back
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {invites.map((invite) => {
            const shopName =
              (invite.shop as { name?: string } | null)?.name ?? "a shop";
            const isBusy = busy === invite.id;

            return (
              <div
                key={invite.id}
                className="card"
                style={{ display: "flex", alignItems: "center", gap: 16 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--color-ink-primary)" }}
                  >
                    {shopName}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--color-ink-tertiary)" }}
                  >
                    Role:{" "}
                    <span style={{ textTransform: "capitalize" }}>
                      {invite.role}
                    </span>{" "}
                    · Invited {formatDate(invite.created_at)}
                    {(invite as { expires_at?: string }).expires_at && (
                      <>
                        {" "}
                        · Expires{" "}
                        {formatDate(
                          (invite as { expires_at?: string }).expires_at!,
                        )}
                      </>
                    )}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={isBusy}
                    onClick={() => handleAccept(invite.id)}
                  >
                    {isBusy ? "Joining…" : "Accept"}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={isBusy}
                    onClick={() => handleReject(invite.id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
