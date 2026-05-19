"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Container from "./Container";

function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--color-surface-0)",
        borderBottom: "1px solid var(--color-border)",
        backdropFilter: "blur(12px)",
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
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="AutoShop Pro"
              width={260}
              height={60}
              className="h-8 w-auto"
              priority
            />
          </Link>

          <nav className="hidden sm:flex items-center gap-8">
            {navLinks.map((l) => (
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

          <div className="hidden sm:flex items-center gap-3">
            <Link href="/login" className="btn btn-ghost btn-sm">
              Log in
            </Link>
            <Link href="/signup" className="btn btn-primary btn-sm">
              Get Started Free
            </Link>
          </div>

          <button
            type="button"
            className="sm:hidden btn btn-ghost"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            style={{ width: 44, height: 44, padding: 0 }}
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
      </Container>

      {menuOpen && (
        <div
          style={{
            background: "var(--color-surface-0)",
            borderTop: "1px solid var(--color-border-subtle)",
          }}
        >
          <Container>
            <div
              style={{
                paddingTop: 16,
                paddingBottom: 16,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {navLinks.map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    padding: "12px 0",
                    fontSize: "0.9375rem",
                    color: "var(--color-ink-primary)",
                    textDecoration: "none",
                    borderBottom:
                      i < navLinks.length - 1
                        ? "1px solid var(--color-border-subtle)"
                        : "none",
                  }}
                >
                  {l.label}
                </a>
              ))}
              <div
                style={{
                  paddingTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <Link
                  href="/login"
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: "center" }}
                  onClick={() => setMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="btn btn-primary btn-sm"
                  style={{ justifyContent: "center" }}
                  onClick={() => setMenuOpen(false)}
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}

export default LandingNav;
