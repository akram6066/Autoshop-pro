import SmoothScroll from "@/components/landing/SmoothScroll";
import LandingNav from "@/components/landing/LandingNav";
import FooterSection from "@/components/landing/FooterSection";
import ContactSection from "@/components/landing/ContactSection";
import CustomCursor from "@/components/landing/CustomCursor";

export const metadata = {
  title: "Contact Us | AutoShop Pro",
  description: "Get in touch with the AutoShop Pro team.",
};

export default function ContactPage() {
  return (
    <SmoothScroll>
      <div
        className="landing-dark text-white bg-[#000000] min-h-screen selection:bg-brand-500/30 selection:text-brand-200"
        style={{ overflowX: "hidden", cursor: "none" }}
      >
        <CustomCursor />
        <LandingNav />
        <main className="pt-24 pb-20">
          <ContactSection />
        </main>
        <FooterSection />
      </div>
    </SmoothScroll>
  );
}
