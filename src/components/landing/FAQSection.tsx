"use client";

import { useState } from "react";
import Container from "./Container";
import SectionHead from "./SectionHead";
import { RevealOnScroll } from "./RevealOnScroll";

const faqs = [
  {
    q: "Is it really free to start?",
    a: "Yes — the free plan includes 1 shop, unlimited sales, full inventory tracking, and basic reports. Pro unlocks multiple shops, advanced analytics, and priority support.",
  },
  {
    q: "Does it work without internet?",
    a: "Yes. AutoShop Pro is built offline-first. Sales and stock changes are saved locally and synced automatically the moment you reconnect.",
  },
  {
    q: "Can I add staff members to my shop?",
    a: "Yes. Invite staff and they get a simplified POS-only interface. Owners have full access; staff see only what they need to do their job.",
  },
  {
    q: "What devices does it work on?",
    a: "Any modern browser — phone, tablet, or computer. Install it as a PWA for a full native app experience with push notifications and offline support.",
  },
  {
    q: "How do I add my existing products?",
    a: "Add products manually or bulk-import via CSV (Pro plan). Most shops finish setup in under an hour.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Data is stored on Supabase (PostgreSQL) with row-level security — only you and your authorised staff can access it. Automatic backups run daily.",
  },
];

function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section
      id="faq"
      style={{
        padding: "88px 0",
        background: "linear-gradient(160deg, #f5f0ff 0%, #eef2ff 100%)",
      }}
    >
      <Container>
        <RevealOnScroll>
          <SectionHead
            eyebrow="FAQ"
            title="Common questions"
            subtitle="Everything you need to know before getting started."
          />
        </RevealOnScroll>
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {faqs.map((item, i) => {
            const isOpen = openIdx === i;
            const bodyId = `faq-body-${i}`;
            const btnId = `faq-btn-${i}`;
            return (
              <RevealOnScroll key={item.q} delay={i * 60}>
                <div
                  style={{
                    borderRadius: isOpen ? "var(--radius-lg)" : 0,
                    background: isOpen
                      ? "var(--color-surface-1)"
                      : "transparent",
                    border: isOpen ? "1px solid var(--color-border)" : "none",
                    borderBottom: isOpen
                      ? undefined
                      : "1px solid var(--color-border-subtle)",
                    marginBottom: isOpen ? 8 : 0,
                    transition: "all 0.2s var(--ease-smooth)",
                    overflow: "hidden",
                  }}
                >
                  <button
                    id={btnId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={bodyId}
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: isOpen ? "20px 20px 0" : "20px 0",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 14 }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: isOpen
                            ? "var(--color-brand-500)"
                            : "var(--color-surface-2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "background 0.2s",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            color: isOpen
                              ? "white"
                              : "var(--color-ink-tertiary)",
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "0.9375rem",
                          color: "var(--color-ink-primary)",
                        }}
                      >
                        {item.q}
                      </span>
                    </div>
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      style={{
                        flexShrink: 0,
                        color: "var(--color-ink-tertiary)",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.25s var(--ease-smooth)",
                      }}
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {/* CSS grid accordion — no layout jank */}
                  <div
                    id={bodyId}
                    role="region"
                    aria-labelledby={btnId}
                    className={`faq-body${isOpen ? " open" : ""}`}
                  >
                    <div className="faq-body-inner">
                      <p
                        style={{
                          padding: "14px 20px 20px 62px",
                          fontSize: "0.9375rem",
                          color: "var(--color-ink-secondary)",
                          lineHeight: 1.75,
                        }}
                      >
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export default FAQSection;
