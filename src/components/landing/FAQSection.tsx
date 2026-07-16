"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Container from "./Container";
import { Plus, Minus } from "lucide-react";

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
      className="py-16 lg:py-32 relative bg-[#020202] overflow-hidden"
    >
      {/* Gradient border line at top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

      <Container className="relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-12 lg:gap-24">
          {/* Left Column — Heading */}
          <div className="lg:w-1/3 lg:sticky lg:top-32 lg:self-start">
            <motion.p
              className="text-xs font-bold tracking-[0.2em] uppercase text-brand-400 mb-4"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              FAQ
            </motion.p>
            <motion.h2
              className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Common <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">
                questions.
              </span>
            </motion.h2>
            <motion.p
              className="text-zinc-400 font-medium leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Everything you need to know before getting started. Can&apos;t find what you&apos;re looking for? Reach out via WhatsApp.
            </motion.p>
          </div>

          {/* Right Column — Accordion */}
          <div className="lg:w-2/3">
            <div className="flex flex-col">
              {faqs.map((item, i) => {
                const isOpen = openIdx === i;
                return (
                  <motion.div
                    key={item.q}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                    className="border-b border-zinc-800/80"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenIdx(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-6 py-6 text-left group"
                    >
                      <span className="text-[17px] font-semibold text-zinc-200 group-hover:text-white transition-colors leading-snug">
                        {item.q}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border transition-all duration-300 ${
                        isOpen 
                          ? "bg-brand-500/20 border-brand-500/30 text-brand-400 rotate-0" 
                          : "bg-zinc-900 border-zinc-800 text-zinc-500 rotate-0"
                      }`}>
                        {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="pb-6 text-[15px] text-zinc-400 leading-[1.8] max-w-xl pr-12 font-medium">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default FAQSection;
