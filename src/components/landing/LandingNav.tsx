"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent, useMotionValue, useSpring } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import Container from "./Container";

const NAV_LINKS = [
  { href: "/", label: "Product", id: "" },
  { href: "/#features", label: "Features", id: "features" },
  { href: "/#solutions", label: "Solutions", id: "solutions" },
  { href: "/#pricing", label: "Pricing", id: "pricing" },
  { href: "/contact", label: "Contact", id: "contact" },
];

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

function LandingNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150 && !menuOpen) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setScrolled(latest > 20);
  });

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <motion.header
        variants={{
          visible: { y: 0 },
          hidden: { y: "-100%" },
        }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "py-2" : "py-4"
        }`}
      >
        <Container>
          <div
            className={`flex items-center justify-between transition-all duration-500 rounded-2xl px-6 ${
              scrolled 
                ? "bg-[#0a0a0a]/70 backdrop-blur-2xl border border-zinc-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)] shadow-inner h-16" 
                : "bg-transparent h-20"
            }`}
          >
            <Link href="/" className="flex-shrink-0 relative group">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-xl bg-brand-500/30 transition-opacity duration-500"></div>
              <Image
                src="/logo.svg"
                alt="AutoShop Pro"
                width={140}
                height={36}
                className="h-8 w-auto relative z-10"
                priority
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="relative text-[14px] font-medium text-zinc-200 hover:text-white transition-colors duration-200 group"
                >
                  {l.label}
                  <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-brand-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
                </Link>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-zinc-200 hover:text-white transition-colors">
                Sign In
              </Link>
              <MagneticButton
                href="/signup"
                className="group relative overflow-hidden px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 border border-white/10 hover:border-brand-500/50 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.05)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center gap-2">Get Started <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
              </MagneticButton>
            </div>

            {/* Hamburger */}
            <button
              className="md:hidden text-zinc-300 p-2 relative z-50"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </Container>
      </motion.header>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-[#020202]/95 backdrop-blur-3xl overflow-y-auto pt-28 pb-10"
        >
          <Container>
            <div className="flex flex-col gap-6">
              {NAV_LINKS.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="block text-3xl font-bold text-zinc-400 hover:text-white border-b border-zinc-900/50 pb-4 tracking-tight"
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              
              <motion.div 
                className="flex flex-col gap-4 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <Link href="/login" onClick={() => setMenuOpen(false)} className="py-4 text-center text-zinc-300 font-medium border border-zinc-800 rounded-xl bg-zinc-900/50">
                  Sign In
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} className="py-4 text-center text-white font-semibold bg-gradient-to-r from-brand-600 to-brand-500 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                  Start Free Trial
                </Link>
              </motion.div>
            </div>
          </Container>
        </motion.div>
      )}
    </>
  );
}

export default LandingNav;
