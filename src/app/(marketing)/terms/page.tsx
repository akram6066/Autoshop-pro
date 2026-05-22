import type { Metadata } from "next";
import Container from "@/components/landing/Container";
import { PolicyHero } from "../_components/PolicyHero";
import { TermsContent } from "./_components/TermsContent";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions that govern your use of AutoShop Pro.",
};

const EFFECTIVE_DATE = "21 May 2026";

export default function TermsPage() {
  return (
    <div>
      <PolicyHero
        eyebrow="Legal"
        title="Terms of Service"
        effectiveDate={EFFECTIVE_DATE}
      />
      <div style={{ padding: "56px 0 80px" }}>
        <Container>
          <div style={{ maxWidth: 760 }}>
            <TermsContent effectiveDate={EFFECTIVE_DATE} />
          </div>
        </Container>
      </div>
    </div>
  );
}
