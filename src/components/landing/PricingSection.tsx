"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Container from "./Container";
import { PlanCard } from "./PlanCard";
import type { PricingPlan } from "@/lib/pricing";

interface PricingSectionProps {
  plans: PricingPlan[];
}

export function PricingSection({ plans }: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const maxDiscount = Math.max(
    0,
    ...plans.map((p) => p.annualDiscountPct ?? 0),
  );

  return (
    <section
      id="pricing"
      className="py-16 lg:py-32 relative bg-[#050505] overflow-hidden"
    >
      {/* Gradient border line at top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
      
      {/* Ambient glow */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <Container className="relative z-10">
        <div className="text-center mb-16">
          <motion.p
            className="text-xs font-bold tracking-[0.2em] uppercase text-brand-400 mb-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Pricing
          </motion.p>
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.05] mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p
            className="text-lg text-zinc-400 max-w-md mx-auto mb-10 font-medium"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Start free, upgrade when you&apos;re ready. No hidden fees, no
            credit card required.
          </motion.p>

          {/* Annual / Monthly toggle */}
          <motion.div
            className="inline-flex items-center gap-1 p-1.5 rounded-full bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                !isAnnual
                  ? "bg-white text-black shadow-[0_2px_10px_rgba(255,255,255,0.1)]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                isAnnual
                  ? "bg-white text-black shadow-[0_2px_10px_rgba(255,255,255,0.1)]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Annual
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-success/20 text-success border border-success/30">
                Save {maxDiscount}%
              </span>
            </button>
          </motion.div>
        </div>

        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          style={{ alignItems: "start", padding: "16px 0 24px" }}
        >
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <PlanCard plan={plan} isAnnual={isAnnual} />
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-center mt-12 text-sm text-zinc-500 font-medium"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          All prices in Kenyan Shillings (KES) ·{" "}
          {isAnnual ? "Billed annually" : "Billed monthly"} · Cancel anytime
        </motion.p>
      </Container>
    </section>
  );
}
