"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import {
  Shield,
  WifiOff,
  Globe2,
  Activity,
  Database,
  Server,
  RefreshCcw,
} from "lucide-react";
import Container from "./Container";
import { MouseEvent } from "react";

const OfflineVisual = () => {
  return (
    <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity duration-700">
      <div className="relative w-48 h-48">
        {/* Abstract animated rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border border-brand-500/20 rounded-full border-t-brand-500/60"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 border border-purple-500/20 rounded-full border-b-purple-500/60"
        />

        {/* Center Icons */}
        <div className="absolute inset-0 flex items-center justify-center gap-6">
          <Database size={24} className="text-zinc-600" />
          <motion.div
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <RefreshCcw size={20} className="text-brand-500" />
          </motion.div>
          <Server size={24} className="text-zinc-600" />
        </div>

        {/* Floating Sync Tag */}
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2 whitespace-nowrap"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></span>
          Local Storage Active
        </motion.div>
      </div>
    </div>
  );
};

import type { LucideIcon } from "lucide-react";

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  size: string;
  visual?: React.ReactNode;
}

const features: FeatureItem[] = [
  {
    icon: WifiOff,
    title: "Offline-First Technology",
    description:
      "Keep selling even when your internet drops. AutoShop Pro stores data locally in IndexedDB and syncs perfectly when the connection returns.",
    color: "from-brand-500 to-brand-400",
    size: "lg:col-span-2 lg:row-span-2",
    visual: <OfflineVisual />,
  },
  {
    icon: Globe2,
    title: "Multi-Location Support",
    description: "Scale from a single shop to a nationwide franchise.",
    color: "from-blue-500 to-blue-400",
    size: "lg:col-span-1 lg:row-span-1",
  },
  {
    icon: Shield,
    title: "Secure Permissions",
    description: "Granular role-based access control.",
    color: "from-purple-500 to-purple-400",
    size: "lg:col-span-1 lg:row-span-1",
  },
  {
    icon: Activity,
    title: "Real-Time Sync",
    description:
      "Every sale and stock adjustment is instantly reflected across all your devices.",
    color: "from-success to-emerald-400",
    size: "lg:col-span-2 lg:row-span-1",
  },
];

// Luxury Bento Card with Mouse Spotlight
function BentoCard({
  feature,
  delay,
}: {
  feature: FeatureItem;
  delay: number;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      className={`group relative rounded-3xl bg-[#0a0a0a] border border-zinc-800/80 p-8 overflow-hidden ${feature.size}`}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Mouse Spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-500 group-hover:opacity-100 z-0"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(255,255,255,0.06),
              transparent 80%
            )
          `,
        }}
      />

      {/* Subtle Inner Glow */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 bg-gradient-to-br ${feature.color} z-0`}
      ></div>

      {/* Optional Custom Visual (e.g. for Offline First) */}
      {feature.visual && <div className="z-0 relative">{feature.visual}</div>}

      <div className="relative z-10 flex flex-col h-full md:w-3/5">
        <div className="w-14 h-14 rounded-2xl bg-[#111] border border-zinc-800 flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
          {/* Icon Glow */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
          ></div>
          <feature.icon className="w-6 h-6 text-zinc-300 group-hover:text-white transition-colors relative z-10" />
        </div>

        <div className="mt-auto">
          <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
            {feature.title}
          </h3>
          <p className="text-zinc-400 leading-relaxed font-medium">
            {feature.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function EnterpriseTrustSection() {
  return (
    <section className="pt-16 lg:pt-32 pb-16 relative bg-[#020202]">
      {/* Complex Mesh Gradient Border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>

      <Container className="relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-end gap-10 mb-20">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight leading-[1.05]">
              Built for businesses that <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">
                cannot afford downtime.
              </span>
            </h2>
          </div>
          <div className="max-w-sm pb-2">
            <p className="text-lg text-zinc-400 font-medium">
              Your software should be as reliable as the vehicles you service.
              Engineered for extreme stability.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-6 auto-rows-[240px]">
          {features.map((feature, i) => (
            <BentoCard key={feature.title} feature={feature} delay={i * 0.1} />
          ))}
        </div>
      </Container>
    </section>
  );
}
