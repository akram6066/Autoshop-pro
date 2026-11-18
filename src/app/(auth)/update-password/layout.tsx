import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getRecoveryUserId } from "@/lib/auth/recoverySession";

/**
 * The password form is only reachable from a verified recovery link: the
 * callback sets a marker for this browser and the session must still be valid
 * for the same user. Anyone else (no session, expired link, or an ordinary
 * signed-in session that never used a reset link) is sent to sign-in. A signed-in
 * user changes their password from the profile page, which asks for the
 * current one.
 */
export default async function UpdatePasswordLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!(await getRecoveryUserId())) {
    redirect("/login?reason=reset_link_invalid");
  }
  return children;
}
