import { OwnerGuard } from "@/components/shop/OwnerGuard";
import type { ReactNode } from "react";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <OwnerGuard>{children}</OwnerGuard>;
}
