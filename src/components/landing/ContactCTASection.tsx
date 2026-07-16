"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Container from "./Container";
import { MessageSquare, ArrowRight } from "lucide-react";

export default function ContactCTASection() {
  return (
    <section className="py-24 relative bg-[#020202] border-t border-zinc-800/50 overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-brand-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      <Container className="relative z-10">
        <motion.div 
          className="flex flex-col md:flex-row items-center justify-between gap-10 p-10 md:p-14 rounded-3xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col md:w-2/3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400">
                <MessageSquare size={18} />
              </div>
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-brand-400">
                Contact Us
              </p>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Have questions? Let&apos;s talk.
            </h3>
            <p className="text-zinc-400 font-medium max-w-lg leading-relaxed">
              Whether you need a custom enterprise setup or have a few questions before starting, our experts are ready to help.
            </p>
          </div>
          
          <div className="md:w-1/3 flex md:justify-end w-full">
            <Link 
              href="/contact"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-xl w-full md:w-auto hover:bg-zinc-100 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.15)]"
            >
              Contact Support
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
