"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import Container from "./Container";
import { Star, BadgeCheck } from "lucide-react";
import { MouseEvent } from "react";

const quotes = [
  {
    body: "Before this, I had no idea what stock was left by Friday. Now I check my phone and know exactly what to reorder — even when the internet is down.",
    name: "Amina K.",
    shop: "Clothing & Accessories",
    city: "Nairobi",
    initials: "AK",
    gradient: "from-brand-500 to-purple-500",
    stars: 5,
  },
  {
    body: "My staff used to 'borrow' items and I'd only find out months later. Now every movement is tracked and I get alerts the moment stock runs low.",
    name: "James O.",
    shop: "Electronics Shop",
    city: "Kampala",
    initials: "JO",
    gradient: "from-success to-emerald-400",
    stars: 5,
  },
  {
    body: "The offline mode saved me during a blackout last month. Customers had no idea anything was wrong — sales kept going. Setup took under an hour.",
    name: "Fatuma M.",
    shop: "Hardware Store",
    city: "Mombasa",
    initials: "FM",
    gradient: "from-purple-500 to-pink-500",
    stars: 5,
  },
];

function TestimonialCard({ q, delay }: { q: typeof quotes[0], delay: number }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      className="group relative rounded-3xl bg-[#0a0a0a] border border-zinc-800/80 p-8 overflow-hidden flex flex-col h-full"
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Mouse Spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              450px circle at ${mouseX}px ${mouseY}px,
              rgba(255,255,255,0.05),
              transparent 80%
            )
          `,
        }}
      />

      {/* Stars */}
      <div className="flex gap-1 mb-6">
        {Array.from({ length: q.stars }).map((_, idx) => (
          <Star key={idx} size={16} className="fill-warning text-warning" />
        ))}
      </div>

      {/* Quote */}
      <p className="text-[15px] text-zinc-300 leading-[1.8] flex-grow mb-8 relative z-10 font-medium">
        &ldquo;{q.body}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${q.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <span className="text-sm font-bold text-white">{q.initials}</span>
        </div>
        <div className="flex-1">
          <p className="font-bold text-white text-[15px] mb-0.5">{q.name}</p>
          <p className="text-sm text-zinc-500">{q.shop} · {q.city}</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
          <BadgeCheck size={14} className="text-success" />
          <span className="text-xs font-semibold text-success">Verified</span>
        </div>
      </div>
    </motion.div>
  );
}

function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="pt-16 pb-32 relative bg-[#020202] overflow-hidden"
    >
      {/* Gradient border line at top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

      {/* Subtle ambient glow */}
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <Container className="relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-end gap-10 mb-20">
          <div className="max-w-2xl">
            <motion.p
              className="text-xs font-bold tracking-[0.2em] uppercase text-brand-400 mb-4"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Testimonials
            </motion.p>
            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.05]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Trusted by shop owners <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">
                across East Africa.
              </span>
            </motion.h2>
          </div>
          <div className="max-w-sm pb-2">
            <motion.p
              className="text-lg text-zinc-400 font-medium"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Real stories from owners who switched from paper and spreadsheets.
            </motion.p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {quotes.map((q, i) => (
            <TestimonialCard key={q.name} q={q} delay={i * 0.1} />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default TestimonialsSection;
