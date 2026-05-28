"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Container from "./Container";

const NAV_LINKS = [
  { href: "/", label: "Home", id: "" },
  { href: "/#features", label: "Features", id: "features" },
  { href: "/#how-it-works", label: "How It Works", id: "how-it-works" },
  { href: "/#pricing", label: "Pricing", id: "pricing" },
  { href: "/#faq", label: "FAQ", id: "faq" },
  { href: "/contact", label: "Contact", id: "contact" },
];

function LandingNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  function closeMenu() {
    setMenuClosing(true);
    setTimeout(() => {
      setMenuOpen(false);
      setMenuClosing(false);
    }, 220);
  }

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      if (window.scrollY < 80) setActiveSection("");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active section tracking
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.id);
    const observers = ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { threshold: 0.25 },
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
        setMenuClosing(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: scrolled
            ? "rgba(255,255,255,0.92)"
            : "rgba(255,255,255,0.7)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: scrolled
            ? "1px solid rgba(99,102,241,0.1)"
            : "1px solid transparent",
          boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.06)" : "none",
          transition:
            "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        <Container>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: 64,
            }}
          >
            <Link href="/" style={{ flexShrink: 0 }}>
              <Image
                src="/logo.svg"
                alt="AutoShop Pro"
                width={120}
                height={32}
                className="h-8 w-auto"
                style={{ width: "auto" }}
                priority
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className={`nav-link${
                    l.id === "contact"
                      ? pathname === "/contact"
                        ? " active"
                        : ""
                      : activeSection === l.id
                        ? " active"
                        : ""
                  }`}
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--color-ink-secondary)",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  {l.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link
                href="/signup"
                className="nav-cta-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  height: 32,
                  padding: "0 12px",
                  borderRadius: "var(--radius-md)",
                  background:
                    "linear-gradient(135deg, #1e40af 0%, #3b6ef5 50%, #6d28d9 100%)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 12,
                  letterSpacing: "0.03em",
                  textDecoration: "none",
                  boxShadow:
                    "0 4px 16px rgba(59,110,245,0.38), 0 1px 4px rgba(59,110,245,0.18)",
                }}
              >
                Get Started Free
              </Link>
            </div>

            {/* Hamburger */}
            <div className="md:hidden">
              <button
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
                style={{
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: "var(--color-ink-primary)",
                  WebkitTapHighlightColor: "transparent",
                  transition: "background 0.15s ease",
                }}
              >
                {menuOpen ? (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M4 8h16M4 16h16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* Spacer to push content below the fixed navbar */}
      <div style={{ height: 64 }} />

      {/* Mobile menu overlay with enter/exit animation */}
      {(menuOpen || menuClosing) && (
        <div
          className={menuClosing ? "menu-slide-out" : "menu-slide-in"}
          style={{
            position: "fixed",
            inset: 0,
            top: 64,
            zIndex: 99,
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            overflowY: "auto",
            WebkitOverflowScrolling:
              "touch" as React.CSSProperties["WebkitOverflowScrolling"],
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <Container>
            <div style={{ paddingTop: 20, paddingBottom: 48 }}>
              <nav style={{ marginBottom: 28 }}>
                {NAV_LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => closeMenu()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 0",
                      fontSize: "1.0625rem",
                      fontWeight: 600,
                      color: (
                        l.id === "contact"
                          ? pathname === "/contact"
                          : activeSection === l.id
                      )
                        ? "var(--color-brand-600)"
                        : "var(--color-ink-primary)",
                      textDecoration: "none",
                      borderBottom: "1px solid var(--color-border-subtle)",
                    }}
                  >
                    {l.label}
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      viewBox="0 0 24 24"
                      style={{ color: "var(--color-ink-ghost)" }}
                    >
                      <path
                        d="M9 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                ))}
              </nav>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <Link
                  href="/login"
                  className="btn btn-secondary"
                  style={{ justifyContent: "center" }}
                  onClick={() => closeMenu()}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="btn btn-primary"
                  style={{ justifyContent: "center" }}
                  onClick={() => closeMenu()}
                >
                  Get Started Free
                </Link>
              </div>

              <div
                style={{
                  marginTop: 32,
                  paddingTop: 24,
                  borderTop: "1px solid var(--color-border-subtle)",
                }}
              >
                <a
                  href="https://wa.me/254799964428"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: "0.875rem",
                    color: "#15803d",
                    textDecoration: "none",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="#25D366"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Chat on WhatsApp · +254 799 964 428
                </a>
              </div>
            </div>
          </Container>
        </div>
      )}
    </>
  );
}

export default LandingNav;
