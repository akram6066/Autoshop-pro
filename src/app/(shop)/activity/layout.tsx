import { OwnerGuard } from "@/components/shop/OwnerGuard";
import type { ReactNode } from "react";

export default function ActivityLayout({ children }: { children: ReactNode }) {
  return <OwnerGuard>{children}</OwnerGuard>;
}
