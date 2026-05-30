import dynamic from "next/dynamic";
import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import StatsSection from "@/components/landing/StatsSection";
import FooterSection from "@/components/landing/FooterSection";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import { fetchPlans, dbPlanToLanding } from "@/lib/plans";

// Deferred: below-the-fold client component (annual/monthly toggle)
const PricingSection = dynamic(() =>
  import("@/components/landing/PricingSection").then((m) => ({
    default: m.PricingSection,
  })),
);

// Deferred: purely server sections far below fold — code-split HTML chunks
const TestimonialsSection = dynamic(
  () => import("@/components/landing/TestimonialsSection"),
);
const WhoItsForSection = dynamic(
  () => import("@/components/landing/WhoItsForSection"),
);
const FinalCTASection = dynamic(
  () => import("@/components/landing/FinalCTASection"),
);

// Deferred: "use client" accordion
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
        <FinalCTASection />
      </main>
      <FooterSection />
      <WhatsAppButton />
    </div>
  );
}
