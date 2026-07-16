"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import Container from "./Container";

function CountUp({ to, duration = 2, prefix = "", suffix = "", decimals = 0 }: { to: number, duration?: number, prefix?: string, suffix?: string, decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const display = useTransform(spring, (current) => {
    return prefix + current.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suffix;
  });

  useEffect(() => {
    if (isInView) {
      spring.set(to);
    }
  }, [isInView, spring, to]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

const metrics = [
  {
    value: 50,
    prefix: "$",
    suffix: "M+",
    label: "Sales Processed",
    description: "Securely routed through our offline-first infrastructure.",
  },
  {
    value: 2.5,
    prefix: "",
    suffix: "M+",
    decimals: 1,
    label: "Parts & Tires Tracked",
    description: "Across hundreds of locations in East Africa.",
  },
  {
    value: 99.9,
    prefix: "",
    suffix: "%",
    decimals: 1,
    label: "System Uptime",
    description: "Engineered for extreme reliability. Zero data lost.",
  },
];

export default function MetricsSection() {
  return (
    <section className="py-24 relative bg-[#020202] overflow-hidden border-y border-zinc-800/50">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-brand-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 divide-y md:divide-y-0 md:divide-x divide-zinc-800/80">
          {metrics.map((m, i) => (
            <motion.div 
              key={m.label} 
              className={`flex flex-col items-center text-center ${i !== 0 ? "pt-12 md:pt-0" : ""}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="text-5xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 tracking-tight mb-4 tabular-nums">
                <CountUp to={m.value} prefix={m.prefix} suffix={m.suffix} decimals={m.decimals} />
              </div>
              <h3 className="text-lg font-bold text-zinc-200 mb-2">{m.label}</h3>
              <p className="text-sm text-zinc-500 max-w-[240px] font-medium leading-relaxed">
                {m.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
