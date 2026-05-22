"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, selectIsOwner, selectRole } from "@/stores/authStore";

export function OwnerGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isOwner = useAuthStore(selectIsOwner);
  const role = useAuthStore(selectRole);

  useEffect(() => {
    // role is null while the store is still hydrating — wait for it.
    // Once it resolves to a non-owner value, redirect immediately.
    if (role !== null && !isOwner) {
      router.replace("/dashboard");
    }
  }, [role, isOwner, router]);

  // Render nothing until the role is known to avoid a flash of owner content.
  if (role === null || !isOwner) return null;

  return <>{children}</>;
}
