import type { Metadata } from "next";
import Container from "@/components/landing/Container";
import { PolicyHero } from "../_components/PolicyHero";
import { PrivacyContent } from "./_components/PrivacyContent";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How AutoShop Pro collects, uses, and protects your data.",
};

const EFFECTIVE_DATE = "21 May 2026";

export default function PrivacyPage() {
  return (
    <div>
      <PolicyHero
        eyebrow="Legal"
        title="Privacy Policy"
        effectiveDate={EFFECTIVE_DATE}
      />
      <div style={{ padding: "56px 0 80px" }}>
        <Container>
          <div style={{ maxWidth: 760 }}>
            <PrivacyContent effectiveDate={EFFECTIVE_DATE} />
          </div>
        </Container>
      </div>
    </div>
  );
}
