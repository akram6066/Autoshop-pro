import type { Metadata } from "next";
import Container from "@/components/landing/Container";
import { PolicyHero } from "../_components/PolicyHero";
import { ContactChannels } from "./_components/ContactChannels";
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
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            {/* Left Column: Contact Channels */}
            <div className="lg:col-span-2 col-span-1">
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--color-ink-primary)",
                  marginBottom: 8,
                }}
              >
                Support channels
              </h2>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-ink-tertiary)",
                  marginBottom: 24,
                  lineHeight: 1.6,
                }}
              >
                Reach us via any of these channels for assistance with your
                account or shop setup.
              </p>
              <ContactChannels className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-5" />
            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-3 col-span-1">
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--color-ink-primary)",
                  marginBottom: 8,
                }}
              >
                Send us a message
              </h2>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-ink-tertiary)",
                  marginBottom: 24,
                  lineHeight: 1.6,
                }}
              >
                Fill in the form below and our team will get back to you within
                one business day.
              </p>
              <ContactForm />
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
