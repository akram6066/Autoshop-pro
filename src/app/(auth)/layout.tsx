import type { ReactNode } from "react";
import { RouteErrorBoundary } from "@/components/ErrorBoundary";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <RouteErrorBoundary>{children}</RouteErrorBoundary>;
}
