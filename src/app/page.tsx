import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import FooterSection from "@/components/landing/FooterSection";
import WhatsAppButton from "@/components/landing/WhatsAppButton";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <LandingNav />
      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <FAQSection />
      </main>
      <FooterSection />
      <WhatsAppButton />
    </div>
  );
}
