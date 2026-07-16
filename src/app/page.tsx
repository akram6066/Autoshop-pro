import { Suspense } from "react";
import dynamic from "next/dynamic";
import SmoothScroll from "@/components/landing/SmoothScroll";
import LandingNav from "@/components/landing/LandingNav";
import CustomCursor from "@/components/landing/CustomCursor";
import HeroSection from "@/components/landing/HeroSection";
import MetricsSection from "@/components/landing/MetricsSection";
import StorytellingShowcase from "@/components/landing/StorytellingShowcase";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import EnterpriseTrustSection from "@/components/landing/EnterpriseTrustSection";
import { AuthCallbackHandler } from "@/components/AuthCallbackHandler";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import ContactCTASection from "@/components/landing/ContactCTASection";
import FooterSection from "@/components/landing/FooterSection";
import { fetchPlans, dbPlanToLanding, FALLBACK_PLANS } from "@/lib/plans";

// Defer client-heavy sections — both have interactive JS (toggle / accordion)
const PricingSection = dynamic(
  () =>
    import("@/components/landing/PricingSection").then((m) => ({
      default: m.PricingSection,
    })),
  { loading: () => <div style={{ minHeight: 480 }} /> },
);

const FAQSection = dynamic(() => import("@/components/landing/FAQSection"), {
  loading: () => <div style={{ minHeight: 320 }} />,
});

// Pricing revalidates hourly so plan changes appear without a deploy
export const revalidate = 3600;

export default async function LandingPage() {
  const dbPlans = await fetchPlans();
  const mapped = dbPlans
    .filter((p) => ["trial", "pro", "ultra_pro"].includes(p.name))
    .map(dbPlanToLanding);
  const plans = mapped.length > 0 ? mapped : FALLBACK_PLANS;

  return (
    <>
      <CustomCursor />
      <SmoothScroll>
        <div
          className="landing-dark text-white bg-[#000000] min-h-screen selection:bg-brand-500/30 selection:text-brand-200"
          style={{ overflowX: "hidden", cursor: "none" }}
        >
          <LandingNav />
        <main>
          <HeroSection />
          <MetricsSection />
          <StorytellingShowcase />
          <HowItWorksSection />
          <EnterpriseTrustSection />
          <TestimonialsSection />
          <Suspense fallback={<div style={{ minHeight: 480 }} />}>
            <PricingSection plans={plans} />
          </Suspense>
          <Suspense fallback={<div style={{ minHeight: 320 }} />}>
            <FAQSection />
          </Suspense>
          <ContactCTASection />
        </main>
        <FooterSection />
        {/* Silently forwards auth tokens to /api/auth/callback when Supabase
            falls back to the Site URL (landing page) instead of the intended
            emailRedirectTo URL. Zero visible UI — runs only when params present. */}
        <AuthCallbackHandler />
      </div>
    </SmoothScroll>
    </>
  );
}
