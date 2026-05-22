"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Container from "./Container";

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lock body scroll while menu is open
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
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "var(--color-surface-0)",
          borderBottom: "1px solid var(--color-border)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
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
            {/* Logo */}
            <Link href="/" style={{ flexShrink: 0 }}>
              <Image
                src="/logo.svg"
                alt="AutoShop Pro"
                width={260}
                height={60}
                className="h-8 w-auto"
                priority
              />
            </Link>

            {/* Desktop nav — hidden on mobile */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
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

            {/* Desktop CTAs — hidden on mobile */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm">
                Get Started Free
              </Link>
            </div>

            {/* Hamburger — mobile only. Wrapped in a div so md:hidden
                controls visibility without fighting the button's own styles. */}
            <div className="md:hidden">
              <button
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
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

      {/* Mobile menu — fixed full-screen overlay so it's never clipped by
          the sticky header and always receives touch events correctly. */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            top: 64, // offset by header height
            zIndex: 99,
            background: "var(--color-surface-0)",
            overflowY: "auto",
            WebkitOverflowScrolling:
              "touch" as React.CSSProperties["WebkitOverflowScrolling"],
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <Container>
            <div style={{ paddingTop: 16, paddingBottom: 40 }}>
              {/* Nav links */}
              <nav style={{ marginBottom: 24 }}>
                {NAV_LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "14px 0",
                      fontSize: "1.0625rem",
                      fontWeight: 600,
                      color: "var(--color-ink-primary)",
                      textDecoration: "none",
                      borderBottom: "1px solid var(--color-border-subtle)",
                    }}
                  >
                    {l.label}
                  </a>
                ))}
              </nav>

              {/* CTA buttons */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <Link
                  href="/login"
                  className="btn btn-secondary"
                  style={{ justifyContent: "center" }}
                  onClick={() => setMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="btn btn-primary"
                  style={{ justifyContent: "center" }}
                  onClick={() => setMenuOpen(false)}
                >
                  Get Started Free
                </Link>
              </div>

              {/* Contact */}
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
