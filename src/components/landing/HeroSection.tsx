"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";
import Container from "./Container";
import Image from "next/image";
import { useRef } from "react";

function MagneticButton({ children, href, className }: { children: React.ReactNode, href: string, className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    x.set(mouseX * 0.2);
    y.set(mouseY * 0.2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: mouseXSpring, y: mouseYSpring }}
      className={className}
    >
      {children}
    </motion.a>
  );
}

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden min-h-screen flex items-center">
      {/* Aurora Mesh Gradient Background */}
      <div className="absolute inset-0 bg-[#020202] z-0 overflow-hidden">
        {/* Animated Orbs */}
        <motion.div 
          animate={{ 
            x: [0, 100, -50, 0], 
            y: [0, -50, 100, 0],
            scale: [1, 1.2, 0.8, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-600/20 blur-[120px] rounded-full mix-blend-screen"
        />
        <motion.div 
          animate={{ 
            x: [0, -100, 50, 0], 
            y: [0, 100, -50, 0],
            scale: [1, 0.8, 1.2, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/15 blur-[140px] rounded-full mix-blend-screen"
        />
        {/* Central Spotlight behind text */}
        <motion.div 
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80%] max-w-[800px] h-[300px] bg-brand-500/15 blur-[100px] rounded-full mix-blend-screen pointer-events-none"
        />
        {/* Noise overlay to prevent banding */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>
      </div>

      <Container className="relative z-10">
        <div className="flex flex-col items-center text-center max-w-[1000px] mx-auto mb-16 pt-10">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="group relative inline-flex items-center gap-3 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/[0.02] border border-white/[0.08] text-xs sm:text-sm font-medium text-zinc-300 mb-10 sm:mb-8 backdrop-blur-2xl shadow-[0_0_20px_rgba(255,255,255,0.02)] overflow-hidden transition-colors hover:bg-white/[0.05]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
              
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
              </span>
              AutoShop Pro 2.0 is now live
              <ArrowRight size={14} className="text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-[5.5rem] font-extrabold tracking-tight text-white mb-6 leading-[1.15] sm:leading-[1.05]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            Power Your Auto Business With <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-purple-400 to-brand-400 bg-[length:200%_auto] animate-gradient relative inline-block">
              Intelligent Management
              <div className="absolute -bottom-2 left-0 w-full h-[30%] bg-brand-500/20 blur-[20px] -z-10"></div>
            </span>
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-10 font-medium leading-relaxed px-4 sm:px-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            The world-class POS, inventory, and branch management system designed specifically for high-volume tire shops, parts stores, and garages.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto px-6 sm:px-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <MagneticButton
              href="/signup"
              className="group relative flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 w-full sm:w-auto bg-white text-black font-bold rounded-xl overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-shadow hover:shadow-[0_0_80px_rgba(255,255,255,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 text-[15px]">Start Free Trial</span>
              <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </MagneticButton>
            
            <MagneticButton
              href="/contact"
              className="group relative flex items-center justify-center gap-3 px-8 py-3.5 sm:py-4 w-full sm:w-auto bg-white/[0.03] border border-white/15 text-white font-semibold rounded-xl hover:bg-white/[0.08] transition-colors backdrop-blur-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)]"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play size={14} className="text-white ml-0.5" />
              </div>
              <span className="text-[15px]">Watch Demo</span>
            </MagneticButton>
          </motion.div>

          <motion.div
            className="mt-12 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[12px] sm:text-[13px] font-semibold tracking-wide uppercase text-zinc-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-brand-400" /> No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-brand-400" /> Offline-first architecture
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-brand-400" /> Cancel anytime
            </div>
          </motion.div>
        </div>

        {/* 3D Cinematic Browser Frame holding the Real UI Image */}
        <motion.div
          className="relative mx-auto max-w-[1080px] w-full mt-8"
          initial={{ opacity: 0, y: 150, rotateX: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ perspective: 2000 }}
        >
          <div className="relative rounded-2xl bg-white dark:bg-[#050505] border border-zinc-200 dark:border-brand-500/30 shadow-[0_20px_100px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_100px_rgba(0,0,0,0.8),0_0_60px_rgba(99,102,241,0.15)] overflow-hidden ring-1 ring-black/5 dark:ring-white/10 group transition-all duration-700 hover:shadow-[0_30px_120px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_30px_120px_rgba(0,0,0,0.9),0_0_80px_rgba(99,102,241,0.25)]">
            
            {/* Ultra-Luxury Glowing Border (Dark Mode Only) */}
            <div className="absolute inset-0 z-0 hidden dark:block">
              <div className="absolute inset-[-2px] bg-gradient-to-r from-brand-500 via-purple-500 to-brand-500 opacity-20 blur-xl animate-pulse-slow"></div>
            </div>

            {/* Fake Browser Chrome */}
            <div className="relative z-10 flex items-center px-4 py-3 bg-zinc-100 dark:bg-[#0a0a0a] border-b border-zinc-200 dark:border-zinc-800/80">
              <div className="flex gap-1.5 w-16">
                <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-800 group-hover:bg-danger transition-colors shadow-sm"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-800 group-hover:bg-warning transition-colors shadow-sm"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-800 group-hover:bg-success transition-colors shadow-sm"></div>
              </div>
              <div className="flex-1 flex items-center justify-center px-2 sm:px-4">
                <div className="h-7 w-full max-w-[280px] bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/50 rounded-md flex items-center justify-center shadow-inner overflow-hidden transition-colors group-hover:border-zinc-300 dark:group-hover:border-zinc-700/50">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-500 font-mono tracking-widest truncate px-2">autoshop-pro.com</span>
                </div>
              </div>
              <div className="w-16 hidden sm:block"></div> {/* Spacer to keep URL centered on desktop */}
            </div>
            
            {/* The Real Dashboard UI Image (Dark mode only because landing page is dark) */}
            <div className="relative z-10 w-full bg-[#000]">
              <Image 
                src="/Dashboard dark mode.png" 
                alt="AutoShop Pro Dashboard" 
                width={2160} 
                height={1350} 
                className="w-full h-auto object-cover"
                priority
              />
              
              {/* Luxury Glass Glare Overlay - sweeps across on hover */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/0 via-white/[0.08] to-white/0 z-20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
              
              {/* Subtle inner shadow for depth */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.4)] z-30"></div>
            </div>
          </div>
          
          {/* Floating Elements (Layered Depth) */}
          <motion.div 
            className="absolute -right-12 top-32 z-30 hidden lg:block"
            animate={{ y: [-15, 15, -15] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-4 w-64 border border-zinc-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400 border border-brand-500/30">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1 font-medium">Daily Revenue</p>
                <p className="text-xl font-bold text-white tracking-tight">$4,850.00</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="absolute -left-12 bottom-32 z-30 hidden lg:block"
            animate={{ y: [15, -15, 15] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-4 w-60 border border-zinc-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center text-warning border border-warning/30">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1 font-medium">Stock Alert</p>
                <p className="text-sm font-bold text-white tracking-tight">Michelin Pilot Sport</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
