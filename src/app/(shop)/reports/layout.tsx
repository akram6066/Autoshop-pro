import { OwnerGuard } from "@/components/shop/OwnerGuard";
import type { ReactNode } from "react";

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return <OwnerGuard>{children}</OwnerGuard>;
}
