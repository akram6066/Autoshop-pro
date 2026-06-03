import { Suspense } from "react";
import dynamic from "next/dynamic";
import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import ProblemSection from "@/components/landing/ProblemSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import WhoItsForSection from "@/components/landing/WhoItsForSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import FooterSection from "@/components/landing/FooterSection";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
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
    <div style={{ minHeight: "100vh", overflowX: "hidden" }}>
      <LandingNav />
      <main>
        <HeroSection />
        <StatsSection />
        <ProblemSection />
        <FeaturesSection />
        <WhoItsForSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <Suspense fallback={<div style={{ minHeight: 480 }} />}>
          <PricingSection plans={plans} />
        </Suspense>
        <Suspense fallback={<div style={{ minHeight: 320 }} />}>
          <FAQSection />
        </Suspense>
        <FinalCTASection />
      </main>
      <FooterSection />
      <WhatsAppButton />
    </div>
  );
}
