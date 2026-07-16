"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Container from "./Container";
import { MessageSquare, Mail, PhoneCall, MapPin, Send, CheckCircle2 } from "lucide-react";

const contactMethods = [
  {
    icon: <MessageSquare size={18} />,
    title: "WhatsApp",
    detail: "+254 799 964 428",
    href: "https://wa.me/254799964428?text=Hi!%20I%27m%20interested%20in%20AutoShop%20Pro.",
  },
  {
    icon: <Mail size={18} />,
    title: "Email",
    detail: "support@autoshop-pro.com",
    href: "mailto:support@autoshop-pro.com",
  },
  {
    icon: <PhoneCall size={18} />,
    title: "Phone",
    detail: "+254 799 964 428",
    href: "tel:+254799964428",
  }
];

export default function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <section id="contact" className="py-16 lg:py-32 relative bg-[#020202] border-t border-zinc-800/50">
      {/* Background ambient glow */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <Container className="relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-20">
          
          {/* Left Column - Heading & Direct Info */}
          <div className="lg:w-5/12 flex flex-col justify-center">
            <motion.p
              className="text-xs font-bold tracking-[0.2em] uppercase text-brand-400 mb-4"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Contact Us
            </motion.p>
            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.05] mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Let&apos;s build your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">
                empire together.
              </span>
            </motion.h2>
            <motion.p
              className="text-lg text-zinc-400 font-medium mb-10 leading-relaxed max-w-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Whether you need a custom enterprise setup, or just have a few questions before starting your free trial, our experts are ready to help.
            </motion.p>

            {/* Direct Methods (Compact) */}
            <motion.div 
              className="flex flex-col gap-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center gap-4 text-sm font-medium text-zinc-500">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-zinc-300">Nairobi, Kenya</p>
                  <p>Mon - Sat · 8AM - 8PM EAT</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                {contactMethods.map((m) => (
                  <a 
                    key={m.title}
                    href={m.href}
                    target={m.href.startsWith("http") ? "_blank" : "_self"}
                    rel={m.href.startsWith("http") ? "noopener noreferrer" : ""}
                    className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:bg-zinc-800/80 transition-colors group"
                  >
                    <div className="text-zinc-400 group-hover:text-white transition-colors">
                      {m.icon}
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-medium">{m.title}</p>
                      <p className="text-[13px] font-semibold text-zinc-300 group-hover:text-white transition-colors">{m.detail}</p>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Contact Form */}
          <motion.div 
            className="lg:w-7/12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="p-8 md:p-10 rounded-[2rem] bg-zinc-900/40 border border-zinc-800 backdrop-blur-md relative overflow-hidden shadow-2xl">
              {/* Form subtle top gradient */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-600 via-purple-600 to-brand-600 opacity-50"></div>

              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-16 text-center h-full">
                  <div className="w-20 h-20 rounded-full bg-success/10 border border-success/20 flex items-center justify-center text-success mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Message Sent!</h3>
                  <p className="text-zinc-400 font-medium max-w-sm">
                    Thank you for reaching out. One of our experts will get back to you shortly.
                  </p>
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="mt-8 text-sm font-semibold text-brand-400 hover:text-brand-300"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="name" className="text-xs font-bold tracking-wider uppercase text-zinc-500 pl-1">Full Name</label>
                      <input 
                        type="text" 
                        id="name"
                        required
                        className="w-full bg-[#050505] border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-medium"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="email" className="text-xs font-bold tracking-wider uppercase text-zinc-500 pl-1">Email Address</label>
                      <input 
                        type="email" 
                        id="email"
                        required
                        className="w-full bg-[#050505] border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-medium"
                        placeholder="john@autoshop.com"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="phone" className="text-xs font-bold tracking-wider uppercase text-zinc-500 pl-1">Phone Number (Optional)</label>
                    <input 
                      type="tel" 
                      id="phone"
                      className="w-full bg-[#050505] border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-medium"
                      placeholder="+254 700 000000"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="message" className="text-xs font-bold tracking-wider uppercase text-zinc-500 pl-1">How can we help?</label>
                    <textarea 
                      id="message"
                      required
                      rows={4}
                      className="w-full bg-[#050505] border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-medium resize-none"
                      placeholder="Tell us about your shop and what you're looking for..."
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative flex items-center justify-center gap-2 w-full py-4 mt-2 bg-white text-black font-bold rounded-xl overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] transition-shadow disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin relative z-10"></div>
                    ) : (
                      <>
                        <span className="relative z-10 text-[15px]">Send Message</span>
                        <Send size={16} className="relative z-10 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-zinc-600 mt-2 font-medium">We usually respond within 2 hours.</p>
                </form>
              )}
            </div>
          </motion.div>

        </div>
      </Container>
    </section>
  );
}
