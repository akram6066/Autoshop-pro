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
import { PLANS } from "@/lib/pricing";

// FAQSection is "use client" (accordion state) and far below the fold — defer its JS.
const FAQSection = dynamic(() => import("@/components/landing/FAQSection"));

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <LandingNav />
      <main>
        <HeroSection />
        <StatsSection />
        <ProblemSection />
        <FeaturesSection />
        <WhoItsForSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection plans={PLANS} />
        <FAQSection />
      </main>
      <FooterSection />
      <WhatsAppButton />
    </div>
  );
}
