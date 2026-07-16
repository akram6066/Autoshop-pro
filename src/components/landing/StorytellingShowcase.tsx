"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Container from "./Container";
import { ShoppingCart, Package, Building2, ArrowRight, Zap, ShieldCheck, Activity } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function StorytellingShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  return (
    <section ref={containerRef} className="py-16 lg:py-32 relative bg-[#020202] overflow-hidden" id="features">
      {/* Subtle Background Glows */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-brand-600/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <Container>
        <div className="flex flex-col gap-24 md:gap-32 lg:gap-40 px-2 sm:px-0">
          
          {/* Pillar 1: Sell Faster */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative">
            <div className="lg:w-1/2 flex flex-col items-start z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-500/5 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-8 shadow-[0_0_30px_rgba(99,102,241,0.15)] backdrop-blur-md">
                <Zap size={28} />
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.15] sm:leading-[1.1] tracking-tight">
                Turn every visit into a <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-200">
                  frictionless checkout.
                </span>
              </h2>
              <p className="text-base sm:text-lg text-zinc-400 mb-8 max-w-lg leading-relaxed">
                Your line should never stall. AutoShop Pro’s POS is engineered for extreme speed. Scan barcodes, process partial payments, and print receipts in milliseconds—even when your internet connection drops.
              </p>
              
              <ul className="flex flex-col gap-5 mb-10">
                {["Lightning-fast product search", "Offline-capable checkout", "Split payments & credit tracking"].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-zinc-300 font-medium">
                    <div className="w-6 h-6 rounded-full bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
                      <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              
              <Link href="/signup" className="group flex items-center gap-2 text-brand-400 font-semibold hover:text-brand-300 transition-colors">
                Experience the POS <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="lg:w-1/2 relative w-full perspective-1000">
              <ParallaxMockup scrollYProgress={scrollYProgress} direction={1}>
                <Image src="/pos dark mode.png" alt="Point of Sale Interface" width={1200} height={800} className="w-full h-auto object-cover rounded-2xl" />
              </ParallaxMockup>
              
              <ParallaxFloat scrollYProgress={scrollYProgress} direction={1.5} offset={20} className="hidden md:block absolute -bottom-8 -left-8 z-20">
                <div className="w-72 p-5 bg-[#0a0a0a]/90 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl flex items-center gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-success/20 to-success/5 border border-success/20 rounded-xl flex items-center justify-center text-success shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">Payment Approved</div>
                    <div className="text-sm text-zinc-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span> Offline sync pending
                    </div>
                  </div>
                </div>
              </ParallaxFloat>
            </div>
          </div>

          {/* Pillar 2: Never Lose Control */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16 relative">
            <div className="lg:w-1/2 flex flex-col items-start z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-8 shadow-[0_0_30px_rgba(168,85,247,0.15)] backdrop-blur-md">
                <Package size={28} />
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.15] sm:leading-[1.1] tracking-tight">
                Know exactly what you have, <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-200">
                  before you run out.
                </span>
              </h2>
              <p className="text-base sm:text-lg text-zinc-400 mb-8 max-w-lg leading-relaxed">
                Stop losing money to dead stock and missing parts. Track every tire, battery, and liter of oil across your entire operation with real-time accuracy and automated predictive reordering.
              </p>
              
              <ul className="flex flex-col gap-5 mb-10">
                {["Automated low-stock alerts", "Bulk inventory adjustments", "Detailed stock movement history"].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-zinc-300 font-medium">
                    <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                      <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="lg:w-1/2 relative w-full perspective-1000">
              <ParallaxMockup scrollYProgress={scrollYProgress} direction={0.8}>
                <Image src="/inventory-dark.png" alt="Inventory Management" width={1200} height={800} className="w-full h-auto object-cover rounded-2xl" />
              </ParallaxMockup>
              
              <ParallaxFloat scrollYProgress={scrollYProgress} direction={1.2} offset={-20} className="hidden md:block absolute top-12 -right-12 z-20">
                <div className="w-64 p-5 bg-[#0a0a0a]/90 backdrop-blur-xl border border-warning/30 rounded-2xl shadow-2xl flex items-center gap-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/20 rounded-xl flex items-center justify-center text-warning shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                    <Package size={24} />
                  </div>
                  <div>
                    <div className="text-white font-bold">Low Stock Alert</div>
                    <div className="text-sm text-zinc-400">3 items critical</div>
                  </div>
                </div>
              </ParallaxFloat>
            </div>
          </div>

          {/* Pillar 3: Manage Every Branch */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative">
            <div className="lg:w-1/2 flex flex-col items-start z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-8 shadow-[0_0_30px_rgba(59,130,246,0.15)] backdrop-blur-md">
                <Building2 size={28} />
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.15] sm:leading-[1.1] tracking-tight">
                One powerful system controlling <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-200">
                  your entire empire.
                </span>
              </h2>
              <p className="text-base sm:text-lg text-zinc-400 mb-8 max-w-lg leading-relaxed">
                Whether you have two shops or twenty, manage them all from a single dashboard. Compare branch performance, transfer stock effortlessly, and standardize pricing globally.
              </p>
              
              <ul className="flex flex-col gap-5 mb-10">
                {["Real-time multi-branch sync", "Cross-location stock transfers", "Centralized financial reporting"].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-zinc-300 font-medium">
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="lg:w-1/2 relative w-full perspective-1000">
              <ParallaxMockup scrollYProgress={scrollYProgress} direction={1.1}>
                <Image src="/sales dark mode.png" alt="Sales and Reporting" width={1200} height={800} className="w-full h-auto object-cover rounded-2xl" />
              </ParallaxMockup>
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
}

// Helper: The 3D Mockup Container with glowing border
function ParallaxMockup({ children, scrollYProgress, direction = 1 }: any) {
  const y = useTransform(scrollYProgress, [0, 1], [-60 * direction, 60 * direction]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [10, 0, -10]);
  
  return (
    <motion.div 
      style={{ y, rotateX }} 
      className="relative rounded-2xl border border-brand-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_40px_rgba(99,102,241,0.1)] ring-1 ring-white/10 group overflow-hidden bg-[#0a0a0a]"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent z-10 pointer-events-none"></div>
      {children}
    </motion.div>
  );
}

// Helper: Floating UI Elements
function ParallaxFloat({ children, scrollYProgress, direction = 1, offset = 0, className = "" }: any) {
  const y = useTransform(scrollYProgress, [0, 1], [-80 * direction + offset, 80 * direction + offset]);
  
  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
