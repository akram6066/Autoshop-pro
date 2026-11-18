import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RECOVERY_COOKIE } from "./callback";

/**
 * The signed-in user's id, only when this browser arrived through a verified
 * password-recovery link (marker cookie set by /api/auth/callback) AND the
 * session is valid for that same user. The session is validated with the auth
 * server (getUser), never trusted from the cookie alone.
 */
export async function getRecoveryUserId(): Promise<string | null> {
  const marker = (await cookies()).get(RECOVERY_COOKIE)?.value;
  if (!marker) return null;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || user.id !== marker) return null;
  return user.id;
}
