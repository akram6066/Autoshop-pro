"use client";

import Link from "next/link";
import { MouseEvent, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { PricingPlan } from "@/lib/pricing";
import { Check, X, ArrowRight, Sparkles } from "lucide-react";

export function PlanCard({
  plan,
  isAnnual = false,
}: {
  plan: PricingPlan;
  isAnnual?: boolean;
}) {
  const isUltra = plan.id === "ultra_pro";
  const displayPrice =
    plan.monthlyPrice && isAnnual
      ? Math.round(plan.monthlyPrice * (1 - plan.annualDiscountPct / 100))
      : plan.monthlyPrice;

  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`group relative rounded-3xl transition-all duration-500 ${
        plan.highlighted
          ? "ring-2 ring-brand-500/50 shadow-[0_0_60px_rgba(99,102,241,0.15)]"
          : isUltra
            ? "ring-1 ring-brand-500/30"
            : "ring-1 ring-zinc-800/80 hover:ring-zinc-700"
      }`}
    >
      {/* Background */}
      <div
        style={{ transform: "translateZ(30px)" }}
        className={`relative p-8 flex flex-col h-full rounded-3xl overflow-hidden ${
          plan.highlighted
            ? "bg-gradient-to-br from-brand-600 via-brand-700 to-purple-800 pt-10"
            : "bg-[#0a0a0a]"
        } ${(plan.badge || (plan.freeTrial && !plan.badge)) ? "pt-10" : ""}`}
      >
        {/* Subtle hover glow for non-highlighted */}
        {!plan.highlighted && (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        )}

        {/* Badge */}
        {(plan.badge || (plan.freeTrial && !plan.badge)) && (
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap shadow-lg z-20 ${
              plan.badge
                ? plan.highlighted
                  ? "bg-white text-brand-600"
                  : "bg-brand-500 text-white"
                : "bg-success text-white"
            }`}
          >
            {plan.badge ?? "1 month free"}
          </div>
        )}

        {/* Plan name */}
        <div className="flex items-center gap-2 mb-6 mt-2">
          {plan.highlighted && <Sparkles size={16} className="text-brand-200" />}
          <p
            className={`text-xs font-bold tracking-[0.14em] uppercase ${
              plan.highlighted
                ? "text-brand-200"
                : isUltra
                  ? "text-brand-400"
                  : "text-zinc-500"
            }`}
          >
            {plan.name}
          </p>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-2 flex-wrap">
          {plan.monthlyPrice === 0 ? (
            <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">Free</span>
          ) : (
            <>
              <span
                className={`text-sm font-semibold ${
                  plan.highlighted ? "text-white/60" : "text-zinc-500"
                }`}
              >
                {plan.currency}
              </span>
              <span
                className={`text-4xl sm:text-5xl font-extrabold tracking-tight text-white`}
              >
                {displayPrice?.toLocaleString()}
              </span>
              <span
                className={`text-sm font-medium ${
                  plan.highlighted ? "text-white/40" : "text-zinc-500"
                }`}
              >
                /mo
              </span>
            </>
          )}
        </div>

        {isAnnual && plan.monthlyPrice && plan.monthlyPrice > 0 && (
          <p
            className={`text-sm mb-2 ${
              plan.highlighted ? "text-white/50" : "text-zinc-600"
            }`}
          >
            <span className="line-through">
              {plan.currency} {plan.monthlyPrice?.toLocaleString()}
            </span>{" "}
            billed annually
          </p>
        )}

        {/* Description */}
        <p
          className={`text-sm leading-relaxed mb-8 min-h-[2.8em] ${
            plan.highlighted ? "text-white/60" : "text-zinc-400"
          }`}
        >
          {plan.description}
        </p>

        {/* CTA button */}
        <Link
          href={plan.ctaHref}
          className={`flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-[15px] transition-all duration-300 ${
            plan.highlighted
              ? "bg-white text-brand-600 hover:bg-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
              : isUltra
                ? "bg-gradient-to-r from-brand-600 to-purple-600 text-white hover:from-brand-500 hover:to-purple-500 shadow-[0_4px_20px_rgba(99,102,241,0.3)]"
                : "bg-zinc-900 text-white border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800"
          }`}
        >
          {plan.cta}
          <ArrowRight size={16} />
        </Link>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div
            className={`flex-1 h-px ${
              plan.highlighted ? "bg-white/15" : "bg-zinc-800"
            }`}
          />
          <span
            className={`text-[11px] font-bold tracking-[0.08em] uppercase ${
              plan.highlighted ? "text-white/30" : "text-zinc-600"
            }`}
          >
            What&apos;s included
          </span>
          <div
            className={`flex-1 h-px ${
              plan.highlighted ? "bg-white/15" : "bg-zinc-800"
            }`}
          />
        </div>

        {/* Feature list */}
        <ul className="flex flex-col gap-3.5">
          {plan.features.map((f) => (
            <li
              key={f.label}
              className={`flex items-center gap-3 text-sm ${
                f.included
                  ? plan.highlighted
                    ? "text-white/85"
                    : "text-zinc-300"
                  : plan.highlighted
                    ? "text-white/20"
                    : "text-zinc-700"
              }`}
            >
              {f.included ? (
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    plan.highlighted
                      ? "bg-white/20"
                      : "bg-brand-500/15"
                  }`}
                >
                  <Check
                    size={12}
                    className={
                      plan.highlighted ? "text-white" : "text-brand-400"
                    }
                  />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-zinc-800/50">
                  <X
                    size={10}
                    className={
                      plan.highlighted ? "text-white/20" : "text-zinc-700"
                    }
                  />
                </div>
              )}
              {f.label}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
