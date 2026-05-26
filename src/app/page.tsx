import dynamic from "next/dynamic";
import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import StatsSection from "@/components/landing/StatsSection";
import WhoItsForSection from "@/components/landing/WhoItsForSection";
import FooterSection from "@/components/landing/FooterSection";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import { StickyMobileCTA } from "@/components/landing/StickyMobileCTA";
import { fetchPlans, dbPlanToLanding } from "@/lib/plans";

// FAQSection is "use client" (accordion state) and far below the fold — defer its JS.
const FAQSection = dynamic(() => import("@/components/landing/FAQSection"));

// Revalidate pricing every hour so admin changes reflect without a deploy.
export const revalidate = 3600;

export default async function LandingPage() {
  const dbPlans = await fetchPlans();
  const plans = dbPlans
    .filter((p) => ["trial", "pro", "ultra_pro"].includes(p.name))
    .map(dbPlanToLanding);

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
        <PricingSection plans={plans} />
        <FAQSection />
      </main>
      <FooterSection />
      <WhatsAppButton />
      <StickyMobileCTA />
    </div>
  );
}
