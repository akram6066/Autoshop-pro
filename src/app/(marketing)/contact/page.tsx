import type { Metadata } from "next";
import Container from "@/components/landing/Container";
import { PolicyHero } from "../_components/PolicyHero";
import { ContactChannels } from "./_components/ContactChannels";
import { ContactSidebar } from "./_components/ContactSidebar";
import { ContactForm } from "./_components/ContactForm";

export const metadata: Metadata = {
  title: "Contact & Support",
  description:
    "Get help with AutoShop Pro — reach us on WhatsApp, email, or the contact form.",
};

export default function ContactPage() {
  return (
    <div>
      <PolicyHero
        eyebrow="Support"
        title="Contact & Support"
        subtitle="Have a question, bug report, or just want to chat about your shop? We're a small team and respond quickly — especially on WhatsApp."
      />

      <div style={{ padding: "60px 0 80px" }}>
        <Container>
          <ContactChannels />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3">
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--color-ink-primary)",
                  marginBottom: 6,
                }}
              >
                Send us a message
              </h2>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--color-ink-tertiary)",
                  marginBottom: 28,
                  lineHeight: 1.6,
                }}
              >
                Fill in the form and we&apos;ll get back to you. For faster
                help, use WhatsApp — it&apos;s how we work best.
              </p>
              <ContactForm />
            </div>

            <div className="lg:col-span-2">
              <ContactSidebar />
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
