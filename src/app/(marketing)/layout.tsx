import type { ReactNode } from "react";
import { RouteErrorBoundary } from "@/components/ErrorBoundary";
import LandingNav from "@/components/landing/LandingNav";
import FooterSection from "@/components/landing/FooterSection";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <RouteErrorBoundary>
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <LandingNav />
        <main style={{ flex: 1 }}>{children}</main>
        <FooterSection />
      </div>
    </RouteErrorBoundary>
  );
}
