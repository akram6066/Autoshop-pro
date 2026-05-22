"use client";

import { useState, useTransition } from "react";
import { useMounted } from "@/hooks/useMounted";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectProfile, selectUser } from "@/stores/authStore";
import { profileSchema } from "@/lib/validations/domain";
import { friendlyError } from "@/lib/api/errors";
import { toast } from "sonner";

export function ProfileForm() {
  const profile = useAuthStore(selectProfile);
  const user = useAuthStore(selectUser);
  const setAll = useAuthStore((s) => s.setAll);

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [isPending, startTransition] = useTransition();
  const mounted = useMounted();

  const shop = useAuthStore((s) => s.shop);
  const shops = useAuthStore((s) => s.shops);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;

    const parsed = profileSchema.safeParse({ full_name: fullName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ full_name: parsed.data.full_name })
        .eq("id", user.id);

      if (updateError) {
        toast.error(friendlyError(updateError));
        return;
      }

      setAll(
        user,
        { ...profile, full_name: parsed.data.full_name },
        shop,
        shops,
      );
      toast.success("Profile updated successfully.");
    });
  }

  if (!profile) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--color-ink-primary)" }}
        >
          Full Name
        </label>
        <input
          className="input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Jane Doe"
          maxLength={200}
          required
        />
      </div>

      <div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={
            !mounted || isPending || fullName.trim() === profile.full_name
          }
        >
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
