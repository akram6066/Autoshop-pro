import Image from "next/image";
import Link from "next/link";
import Container from "./Container";
import { ArrowRight } from "lucide-react";

const footerCols = [
  {
    heading: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#solutions", label: "Solutions" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/careers", label: "Careers" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/security", label: "Security" },
    ],
  },
];

const socials = [
  { 
    label: "Twitter", 
    href: "#", 
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  { 
    label: "LinkedIn", 
    href: "#", 
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2" y="9" width="4" height="12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    ) 
  },
  { 
    label: "Instagram", 
    href: "#", 
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    ) 
  },
  { 
    label: "Facebook", 
    href: "#", 
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) 
  },
];

export default function FooterSection() {
  return (
    <footer className="relative bg-[#020202] pt-16 lg:pt-32 pb-10 overflow-hidden border-t border-zinc-800/40">
      {/* Luxurious Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[1px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[400px] bg-brand-600/10 blur-[150px] pointer-events-none"></div>

      <Container className="relative z-10">
        <div className="flex flex-col lg:flex-row justify-between gap-16 lg:gap-12 lg:gap-24 mb-20">
          
          {/* Brand & Newsletter Column */}
          <div className="lg:w-4/12 flex flex-col">
            <Link href="/" className="inline-block mb-6 relative group">
              <div className="absolute inset-0 bg-brand-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Image
                src="/logo.svg"
                alt="AutoShop Pro"
                width={160}
                height={40}
                className="h-10 w-auto relative z-10"
              />
            </Link>
            
            <p className="text-zinc-400 leading-relaxed mb-8 text-[15px]">
              The offline-first operating system for the modern auto shop. Built for speed, reliability, and enterprise scale.
            </p>

            {/* Newsletter Subscription (Visual) */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold tracking-widest uppercase text-white">Subscribe to updates</span>
              <div className="flex items-center w-full max-w-sm bg-[#0a0a0a] border border-zinc-800 rounded-xl p-1 focus-within:border-brand-500/50 focus-within:ring-1 focus-within:ring-brand-500/20 transition-all">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="bg-transparent border-none text-white text-sm px-4 py-2 w-full focus:outline-none placeholder:text-zinc-600"
                />
                <button className="bg-white text-black p-2 rounded-lg hover:bg-zinc-200 transition-colors">
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:w-7/12 grid grid-cols-2 sm:grid-cols-3 gap-10">
            {footerCols.map((col) => (
              <div key={col.heading} className="flex flex-col">
                <h4 className="text-white font-bold mb-6">{col.heading}</h4>
                <ul className="flex flex-col gap-4">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link 
                        href={link.href}
                        className="text-[15px] text-zinc-400 hover:text-brand-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Separator line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent mb-10"></div>

        {/* Bottom Section (Status, Socials, Copyright) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Status Badge */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="text-xs font-semibold text-zinc-300">All systems operational</span>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-2">
            {socials.map((social) => (
              <a 
                key={social.label} 
                href={social.href} 
                aria-label={social.label}
                className="w-10 h-10 rounded-full bg-zinc-900/50 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-brand-500/10 hover:text-brand-400 hover:border-brand-500/30 transition-all"
              >
                {social.icon}
              </a>
            ))}
          </div>
          
          {/* Copyright */}
          <p className="text-sm text-zinc-600 font-medium">
            © {new Date().getFullYear()} AutoShop Pro. All rights reserved.
          </p>

        </div>
      </Container>
    </footer>
  );
}
