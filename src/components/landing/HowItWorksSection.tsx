"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Container from "./Container";
import { UserPlus, Download, Zap } from "lucide-react";

const steps = [
  {
    title: "Create your account",
    description: "Sign up in seconds. No credit card required. Your shop is instantly created and secured in the cloud.",
    icon: <UserPlus size={24} className="text-brand-400" />,
    image: "/step1 dark.png",
    color: "from-brand-500/20 to-brand-500/5",
    borderColor: "border-brand-500/20",
    glowColor: "shadow-[0_0_30px_rgba(99,102,241,0.15)]",
  },
  {
    title: "Add your inventory",
    description: "Import your existing stock via CSV or add items manually. The system automatically organizes your catalog for fast searching.",
    icon: <Download size={24} className="text-purple-400" />,
    image: "/step 2 dark.png",
    color: "from-purple-500/20 to-purple-500/5",
    borderColor: "border-purple-500/20",
    glowColor: "shadow-[0_0_30px_rgba(168,85,247,0.15)]",
  },
  {
    title: "Start selling",
    description: "Connect a barcode scanner or search manually. Process sales, track stock, and view real-time reports instantly.",
    icon: <Zap size={24} className="text-success" />,
    image: "/step3 dark.png",
    color: "from-success/20 to-success/5",
    borderColor: "border-success/20",
    glowColor: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-16 lg:py-32 relative bg-[#050505] overflow-hidden" id="how-it-works">
      {/* Top Border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
      
      {/* Ambient background blur */}
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-brand-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <Container className="relative z-10">
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <motion.p
            className="text-xs font-bold tracking-[0.2em] uppercase text-brand-400 mb-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            How to Setup
          </motion.p>
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] sm:leading-[1.05] mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Live in minutes. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">
              Not months.
            </span>
          </motion.h2>
          <motion.p
            className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto font-medium px-4 sm:px-0"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            We stripped away the complexity so you can focus on running your business. Getting started is as easy as 1-2-3.
          </motion.p>
        </div>

        <div className="flex flex-col gap-16 lg:gap-24 relative px-2 sm:px-0">
          {/* Vertical Connecting Line */}
          <div className="absolute left-8 lg:left-1/2 top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-zinc-800 to-transparent -translate-x-1/2 hidden md:block"></div>

          {steps.map((step, i) => {
            const isEven = i % 2 === 0;
            
            return (
              <div key={step.title} className={`flex flex-col md:flex-row items-center gap-8 sm:gap-12 lg:gap-24 relative ${isEven ? "" : "md:flex-row-reverse"}`}>
                
                {/* Number Circle in the center (Desktop) */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#0a0a0a] border border-zinc-700 items-center justify-center z-10 shadow-xl">
                  <span className="text-lg font-bold text-white">{i + 1}</span>
                </div>

                {/* Text Content */}
                <motion.div 
                  className={`md:w-1/2 flex flex-col ${isEven ? "md:items-end md:text-right" : "md:items-start md:text-left"}`}
                  initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} border ${step.borderColor} flex items-center justify-center mb-6 ${step.glowColor} backdrop-blur-md`}>
                    {step.icon}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 tracking-tight">{step.title}</h3>
                  <p className="text-base sm:text-[17px] text-zinc-400 leading-relaxed max-w-md">
                    {step.description}
                  </p>
                </motion.div>

                {/* Image Showcase */}
                <motion.div 
                  className="md:w-1/2 w-full"
                  initial={{ opacity: 0, x: isEven ? 40 : -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="relative w-full perspective-1000">
                    <motion.div 
                      className={`relative rounded-2xl border ${step.borderColor} ${step.glowColor} ring-1 ring-white/10 group overflow-hidden bg-[#0a0a0a]`}
                      whileHover={{ scale: 1.02, rotateX: 2, rotateY: isEven ? -2 : 2 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                      <Image 
                        src={step.image} 
                        alt={step.title} 
                        width={1200}
                        height={800}
                        className="w-full h-auto object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent z-10 pointer-events-none"></div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
