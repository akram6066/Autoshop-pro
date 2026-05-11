"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

function Container({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px", ...style }}
    >
      {children}
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ textAlign: "center", marginBottom: 56 }}>
      <span
        style={{
          display: "inline-block",
          padding: "4px 14px",
          borderRadius: 999,
          background: "var(--color-brand-50)",
          border: "1px solid var(--color-brand-100)",
          fontSize: "0.6875rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase" as const,
          color: "var(--color-brand-600)",
          marginBottom: 16,
        }}
      >
        {eyebrow}
      </span>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)",
          lineHeight: 1.15,
          color: "var(--color-ink-primary)",
          marginBottom: subtitle ? 16 : 0,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontSize: "1.0625rem",
            color: "var(--color-ink-secondary)",
            maxWidth: 520,
            margin: "0 auto",
            lineHeight: 1.72,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── 1. Navbar ────────────────────────────────────────────────────────────────

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
              src="/logo.png"
              alt="AutoShop Pro"
              width={160}
              height={32}
              className="h-8 w-auto dark:brightness-0 dark:invert"
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
            className="sm:hidden btn btn-icon btn-ghost"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
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

// ─── 2. Hero ──────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section
      style={{
        padding: "80px 0 0",
        background: "var(--color-surface-0)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Gradient backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, #dce6fe 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Grid dot pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, var(--color-brand-200) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.22,
          pointerEvents: "none",
        }}
      />
      {/* Side glows */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: -160,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "var(--color-brand-100)",
          opacity: 0.45,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 40,
          right: -160,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "var(--color-brand-200)",
          opacity: 0.35,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <Container style={{ position: "relative" }}>
        {/* ── Top content ── */}
        <div style={{ textAlign: "center", paddingBottom: 56 }}>
          {/* Pill badge */}
          <div style={{ marginBottom: 28 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 18px",
                borderRadius: 999,
                background: "white",
                border: "1px solid var(--color-brand-200)",
                boxShadow: "0 1px 8px rgba(59,110,245,0.12)",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--color-brand-700)",
                letterSpacing: "0.03em",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--color-success)",
                  display: "inline-block",
                  boxShadow: "0 0 0 3px var(--color-success-light)",
                }}
              />
              Now live · Free plan available
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.75rem, 6vw, 4.5rem)",
              lineHeight: 1.06,
              color: "var(--color-ink-primary)",
              maxWidth: 820,
              margin: "0 auto 10px",
              letterSpacing: "-0.02em",
            }}
          >
            Run your auto parts shop
          </h1>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.75rem, 6vw, 4.5rem)",
              lineHeight: 1.06,
              color: "var(--color-brand-500)",
              maxWidth: 820,
              margin: "0 auto 28px",
              letterSpacing: "-0.02em",
            }}
          >
            like a modern business.
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: "1.1875rem",
              color: "var(--color-ink-secondary)",
              maxWidth: 520,
              margin: "0 auto 44px",
              lineHeight: 1.78,
            }}
          >
            Inventory, POS, staff management and reports — all in one place,
            even when the internet goes out.
          </p>

          {/* CTAs */}
          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 52,
            }}
          >
            <Link
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "15px 34px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-brand-500)",
                color: "white",
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(59,110,245,0.35)",
                letterSpacing: "0.01em",
              }}
            >
              Start for free
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "15px 34px",
                borderRadius: "var(--radius-md)",
                background: "white",
                color: "var(--color-ink-primary)",
                fontWeight: 600,
                fontSize: "1rem",
                textDecoration: "none",
                border: "1.5px solid var(--color-border)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="1.75"
                />
                <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
              </svg>
              Watch demo
            </a>
          </div>

          {/* Trust row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 0,
            }}
          >
            {/* Avatars */}
            <div style={{ display: "flex", marginRight: 4 }}>
              {[
                "var(--color-brand-500)",
                "var(--color-success)",
                "var(--color-warning)",
                "var(--color-danger)",
              ].map((bg, i) => (
                <div
                  key={i}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: bg,
                    border: "2px solid white",
                    marginLeft: i === 0 ? 0 : -10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                  }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="8"
                      r="4"
                      fill="white"
                      fillOpacity="0.9"
                    />
                    <path
                      d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                      fill="white"
                      fillOpacity="0.9"
                    />
                  </svg>
                </div>
              ))}
            </div>
            <div
              style={{
                width: 1,
                height: 20,
                background: "var(--color-border)",
                margin: "0 4px",
              }}
            />
            <div style={{ display: "flex", gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="var(--color-warning)"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <span
              style={{
                fontSize: "0.875rem",
                color: "var(--color-ink-secondary)",
                fontWeight: 500,
              }}
            >
              <strong style={{ color: "var(--color-ink-primary)" }}>
                50+ shops
              </strong>{" "}
              trust AutoShop Pro
            </span>
            <div
              style={{
                width: 1,
                height: 20,
                background: "var(--color-border)",
                margin: "0 4px",
              }}
            />
            <span
              style={{
                fontSize: "0.875rem",
                color: "var(--color-ink-tertiary)",
              }}
            >
              No credit card required
            </span>
          </div>
        </div>

        {/* ── Dashboard screenshot ── */}
        <div style={{ position: "relative", maxWidth: 960, margin: "0 auto" }}>
          {/* Floating stat cards */}
          <div
            className="hidden sm:block"
            style={{
              position: "absolute",
              top: 40,
              left: -48,
              zIndex: 10,
              background: "white",
              borderRadius: "var(--radius-lg)",
              padding: "14px 18px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
              border: "1px solid var(--color-border)",
              minWidth: 160,
            }}
          >
            <p
              style={{
                fontSize: "0.6875rem",
                color: "var(--color-ink-tertiary)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}
            >
              Today&apos;s Revenue
            </p>
            <p
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--color-ink-primary)",
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              KSh 84,200
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--color-success)",
                  background: "var(--color-success-light)",
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M12 19V5M5 12l7-7 7 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                +18%
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-ink-tertiary)",
                }}
              >
                vs yesterday
              </span>
            </div>
          </div>

          <div
            className="hidden sm:block"
            style={{
              position: "absolute",
              top: 40,
              right: -48,
              zIndex: 10,
              background: "white",
              borderRadius: "var(--radius-lg)",
              padding: "14px 18px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
              border: "1px solid var(--color-border)",
              minWidth: 150,
            }}
          >
            <p
              style={{
                fontSize: "0.6875rem",
                color: "var(--color-ink-tertiary)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}
            >
              Stock Alert
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-warning-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M12 9v4M12 17h.01"
                    stroke="var(--color-warning)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    stroke="var(--color-warning)"
                    strokeWidth="1.75"
                  />
                </svg>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: "var(--color-ink-primary)",
                  }}
                >
                  3 items low
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-ink-tertiary)",
                  }}
                >
                  Reorder needed
                </p>
              </div>
            </div>
          </div>

          <div
            className="hidden lg:block"
            style={{
              position: "absolute",
              bottom: 40,
              left: -36,
              zIndex: 10,
              background: "white",
              borderRadius: "var(--radius-lg)",
              padding: "12px 16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--color-success-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="var(--color-success)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "var(--color-ink-primary)",
                }}
              >
                Sale recorded
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-ink-tertiary)",
                }}
              >
                Offline — syncing…
              </p>
            </div>
          </div>

          {/* Browser frame */}
          <div
            style={{
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              border: "1px solid var(--color-border)",
              boxShadow:
                "0 32px 100px -16px rgba(39,82,232,0.22), 0 8px 32px rgba(0,0,0,0.1)",
              background: "var(--color-surface-0)",
            }}
          >
            {/* Chrome */}
            <div
              style={{
                background: "var(--color-surface-1)",
                borderBottom: "1px solid var(--color-border)",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", gap: 6 }}>
                {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                  <span
                    key={c}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: c,
                      display: "inline-block",
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  flex: 1,
                  maxWidth: 340,
                  margin: "0 auto",
                  background: "var(--color-surface-0)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 10,
                  paddingRight: 10,
                  gap: 6,
                }}
              >
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24">
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    stroke="var(--color-success)"
                    strokeWidth="2"
                  />
                  <path
                    d="M7 11V7a5 5 0 0110 0v4"
                    stroke="var(--color-success)"
                    strokeWidth="2"
                  />
                </svg>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    color: "var(--color-ink-tertiary)",
                  }}
                >
                  app.autoshoppro.com/dashboard
                </span>
              </div>
            </div>
            <Image
              src="/dashboard.png"
              alt="AutoShop Pro dashboard"
              width={960}
              height={540}
              className="w-full h-auto block"
              priority
            />
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-px"
          style={{
            background: "var(--color-border)",
            border: "1px solid var(--color-border)",
            borderTop: "none",
            borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
            overflow: "hidden",
            marginBottom: 0,
          }}
        >
          {[
            { value: "50+", label: "Active shops" },
            { value: "3 cities", label: "Nairobi · Mombasa · Kampala" },
            { value: "100%", label: "Offline capable" },
            { value: "Free", label: "To start, always" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "var(--color-surface-0)",
                padding: "18px 24px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontWeight: 800,
                  fontSize: "1.25rem",
                  color: "var(--color-brand-600)",
                  marginBottom: 2,
                }}
              >
                {stat.value}
              </p>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-ink-tertiary)",
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ─── 3. Problem ───────────────────────────────────────────────────────────────

const problems = [
  {
    title: "Paper records get lost",
    desc: "Handwritten stock books disappear, get damaged, or become unreadable — leaving you guessing your own inventory.",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8l-6-5z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 3v5h5M10 12h4M10 16h2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Internet cuts out at the worst time",
    desc: "Most shop software stops mid-sale when you lose connection. AutoShop Pro keeps working no matter what.",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M1 6s2-2 11-2 11 2 11 2M5 12s1.5-2 7-2 7 2 7 2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle
          cx="12"
          cy="18"
          r="2"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M2 21l20-18"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "No visibility into your team",
    desc: "You can't track what staff sold, what discounts were given, or what went missing when you weren't watching.",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M16 11l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function ProblemSection() {
  return (
    <section
      style={{ padding: "88px 0", background: "var(--color-surface-0)" }}
    >
      <Container>
        <SectionHead
          eyebrow="The problem"
          title="Paper and spreadsheets are holding you back"
          subtitle="Every day without the right tools costs you time, money, and peace of mind."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <div
              key={p.title}
              style={{
                padding: "32px 28px",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-surface-1)",
                border: "1px solid var(--color-border)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Subtle corner accent */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 80,
                  height: 80,
                  background:
                    i === 0
                      ? "var(--color-danger)"
                      : i === 1
                        ? "var(--color-warning)"
                        : "var(--color-brand-500)",
                  opacity: 0.06,
                  borderBottomLeftRadius: "100%",
                }}
              />
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    i === 0
                      ? "color-mix(in srgb, var(--color-danger) 12%, transparent)"
                      : i === 1
                        ? "color-mix(in srgb, var(--color-warning) 12%, transparent)"
                        : "var(--color-brand-50)",
                  color:
                    i === 0
                      ? "var(--color-danger)"
                      : i === 1
                        ? "var(--color-warning)"
                        : "var(--color-brand-600)",
                  marginBottom: 20,
                  flexShrink: 0,
                }}
              >
                {p.icon}
              </div>
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: "1.0625rem",
                  color: "var(--color-ink-primary)",
                  marginBottom: 10,
                }}
              >
                {p.title}
              </h3>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--color-ink-secondary)",
                  lineHeight: 1.7,
                }}
              >
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ─── 4. Features ─────────────────────────────────────────────────────────────

const features = [
  {
    title: "Lightning-fast POS",
    desc: "Complete a sale in seconds. Accept cash, M-Pesa, card, or credit — and share receipts instantly.",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect
          x="2"
          y="5"
          width="20"
          height="15"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M2 10h20M6 15h4M14 15h4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Smart Inventory",
    desc: "Track stock by room or shelf. Set reorder alerts and never run out of your fastest-moving items.",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m8 4v10"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Multi-branch ready",
    desc: "Manage all your shops from one account. Switch between branches instantly from the nav bar.",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 22V12h6v10"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Sales Reports",
    desc: "Daily and weekly revenue, top-selling products, and low-stock alerts — all in one clear view.",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M18 20V10M12 20V4M6 20v-6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Customer Debt Tracking",
    desc: "Record credit sales and track outstanding balances per customer. No more forgotten tabs.",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect
          x="2"
          y="5"
          width="20"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M2 10h20M6 15h4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Works Offline",
    desc: "Built as a PWA. Every sale and stock change saves locally and syncs automatically when you reconnect.",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M1 6s2-2 11-2 11 2 11 2M5 12s1.5-2 7-2 7 2 7 2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle
          cx="12"
          cy="18"
          r="2"
          stroke="currentColor"
          strokeWidth="1.75"
        />
      </svg>
    ),
  },
];

function FeaturesSection() {
  return (
    <section
      id="features"
      style={{
        padding: "88px 0",
        background: "var(--color-surface-1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "var(--color-brand-50)",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />
      <Container style={{ position: "relative" }}>
        <SectionHead
          eyebrow="Features"
          title="Everything your shop needs"
          subtitle="One tool for POS, inventory, staff, and reporting — with offline support built in from day one."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                padding: "28px 24px",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-surface-0)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-card)",
                display: "flex",
                flexDirection: "column",
                gap: 0,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--color-brand-500)",
                  color: "white",
                  marginBottom: 18,
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "var(--color-ink-primary)",
                  marginBottom: 8,
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--color-ink-secondary)",
                  lineHeight: 1.7,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ─── 5. How It Works ─────────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      img: "/step1.png",
      title: "Create your shop",
      desc: "Sign up and add your shop name, address, and storage rooms in under two minutes. No setup fee.",
    },
    {
      num: "02",
      img: "/step2.png",
      title: "Add your inventory",
      desc: "Add items manually or bulk-import via CSV. Set quantity, purchase price, selling price, and room location.",
    },
    {
      num: "03",
      img: "/step3.png",
      title: "Start selling",
      desc: "Your team uses the POS on any device. Sales sync across branches automatically, online or offline.",
    },
  ];

  return (
    <section
      id="how-it-works"
      style={{ padding: "88px 0", background: "var(--color-surface-0)" }}
    >
      <Container>
        <SectionHead
          eyebrow="How it works"
          title="Up and running in minutes"
          subtitle="No IT setup, no training sessions. Sign up and go."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.num} style={{ position: "relative" }}>
              {/* Connector line between steps */}
              {i < 2 && (
                <div
                  className="hidden sm:block"
                  style={{
                    position: "absolute",
                    top: 28,
                    left: "calc(50% + 32px)",
                    width: "calc(100% - 64px)",
                    height: 2,
                    background:
                      "linear-gradient(to right, var(--color-brand-200), var(--color-brand-100))",
                    zIndex: 0,
                  }}
                />
              )}

              <div
                style={{ textAlign: "center", position: "relative", zIndex: 1 }}
              >
                {/* Step number circle */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "var(--color-brand-500)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                    boxShadow: "0 0 0 8px var(--color-brand-50)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      color: "white",
                    }}
                  >
                    {step.num}
                  </span>
                </div>

                {/* Screenshot */}
                <div
                  style={{
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    border: "1px solid var(--color-border)",
                    boxShadow: "var(--shadow-raised)",
                    marginBottom: 24,
                  }}
                >
                  <Image
                    src={step.img}
                    alt={step.title}
                    width={400}
                    height={300}
                    className="w-full h-auto"
                  />
                </div>

                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1.0625rem",
                    color: "var(--color-ink-primary)",
                    marginBottom: 8,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--color-ink-secondary)",
                    lineHeight: 1.7,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ─── 6. Testimonials ─────────────────────────────────────────────────────────

function TestimonialsSection() {
  const quotes = [
    {
      body: "Before AutoShop Pro, I had no idea what stock was left by Friday. Now I check my phone and know exactly what to reorder.",
      name: "Musa A.",
      shop: "Tyre & Battery Shop",
      city: "Nairobi",
      initials: "MA",
      color: "var(--color-brand-500)",
    },
    {
      body: "My staff used to 'borrow' items and I'd only find out months later. Now every movement is tracked and accounted for.",
      name: "Fatuma K.",
      shop: "Auto Parts Store",
      city: "Mombasa",
      initials: "FK",
      color: "var(--color-success)",
    },
    {
      body: "The offline mode saved me during a power cut last month. Customers had no idea anything was wrong.",
      name: "James O.",
      shop: "Rim Centre",
      city: "Kampala",
      initials: "JO",
      color: "var(--color-warning)",
    },
  ];

  return (
    <section
      style={{
        padding: "88px 0",
        background: "var(--color-surface-1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: -60,
          right: -60,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "var(--color-brand-100)",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />
      <Container style={{ position: "relative" }}>
        <SectionHead
          eyebrow="Testimonials"
          title="Shops across East Africa trust AutoShop Pro"
          subtitle="Real stories from owners who switched from paper to digital."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {quotes.map((q) => (
            <div
              key={q.name}
              style={{
                padding: "32px 28px",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-surface-0)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-card)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Stars */}
              <div style={{ display: "flex", gap: 3, marginBottom: 20 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="var(--color-warning)"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              {/* Large opening quote */}
              <svg
                width="28"
                height="22"
                fill="none"
                viewBox="0 0 36 28"
                style={{ marginBottom: 12, flexShrink: 0 }}
              >
                <path
                  d="M0 28V17.5C0 7.5 6 2 18 0l2 3.5C13 5.5 10 9 10 14h6V28H0zm18 0V17.5C18 7.5 24 2 36 0l2 3.5C31 5.5 28 9 28 14h6V28H18z"
                  fill="var(--color-brand-100)"
                />
              </svg>

              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--color-ink-secondary)",
                  lineHeight: 1.75,
                  flexGrow: 1,
                  marginBottom: 24,
                  fontStyle: "italic",
                }}
              >
                {q.body}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: q.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "white",
                    }}
                  >
                    {q.initials}
                  </span>
                </div>
                <div>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      color: "var(--color-ink-primary)",
                    }}
                  >
                    {q.name}
                  </p>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-ink-tertiary)",
                    }}
                  >
                    {q.shop} · {q.city}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ─── 7. Waitlist ──────────────────────────────────────────────────────────────

function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 600);
  }

  return (
    <section
      id="waitlist"
      style={{
        padding: "96px 0",
        background: "var(--color-brand-50)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "var(--color-brand-100)",
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -80,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "var(--color-brand-100)",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />

      <Container style={{ position: "relative" }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div>
            <span
              style={{
                display: "inline-block",
                padding: "4px 14px",
                borderRadius: 999,
                background: "var(--color-brand-500)",
                color: "white",
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                marginBottom: 20,
              }}
            >
              Early access
            </span>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 3.5vw, 2.875rem)",
                lineHeight: 1.15,
                color: "var(--color-ink-primary)",
                marginBottom: 16,
              }}
            >
              Be first in line when we launch
            </h2>

            <p
              style={{
                fontSize: "1.0625rem",
                color: "var(--color-ink-secondary)",
                lineHeight: 1.75,
                marginBottom: 32,
                maxWidth: 440,
              }}
            >
              We&apos;re onboarding shops in batches. Join now to lock in
              founder pricing and get priority support.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                marginBottom: 36,
              }}
            >
              {[
                "Founder pricing — locked in forever",
                "Priority onboarding with our team",
                "Shape the product roadmap directly",
              ].map((benefit) => (
                <div
                  key={benefit}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--color-brand-500)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span
                    style={{
                      fontSize: "0.9375rem",
                      color: "var(--color-ink-primary)",
                    }}
                  >
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            {/* Avatar row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex" }}>
                {[
                  "var(--color-brand-500)",
                  "var(--color-success)",
                  "var(--color-warning)",
                ].map((bg, i) => (
                  <div
                    key={i}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: bg,
                      border: "2px solid var(--color-brand-50)",
                      marginLeft: i === 0 ? 0 : -10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="8"
                        r="4"
                        fill="white"
                        fillOpacity="0.85"
                      />
                      <path
                        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                        fill="white"
                        fillOpacity="0.85"
                      />
                    </svg>
                  </div>
                ))}
              </div>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-ink-secondary)",
                }}
              >
                <strong style={{ color: "var(--color-ink-primary)" }}>
                  50+
                </strong>{" "}
                shop owners already on the list
              </p>
            </div>
          </div>

          {/* Right — form card */}
          <div
            style={{
              background: "var(--color-surface-0)",
              borderRadius: "var(--radius-lg)",
              padding: "40px",
              boxShadow: "var(--shadow-raised)",
              border: "1px solid var(--color-border)",
            }}
          >
            {submitted ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "var(--color-success-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                  }}
                >
                  <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="var(--color-success)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    color: "var(--color-ink-primary)",
                    marginBottom: 10,
                  }}
                >
                  You&apos;re on the list!
                </h3>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--color-ink-secondary)",
                    lineHeight: 1.65,
                  }}
                >
                  We&apos;ll email{" "}
                  <strong style={{ color: "var(--color-ink-primary)" }}>
                    {email}
                  </strong>{" "}
                  as soon as your spot is ready.
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 28 }}>
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: "1.25rem",
                      color: "var(--color-ink-primary)",
                      marginBottom: 6,
                    }}
                  >
                    Request early access
                  </h3>
                  <p
                    style={{
                      fontSize: "0.9375rem",
                      color: "var(--color-ink-secondary)",
                      lineHeight: 1.6,
                    }}
                  >
                    Reserve your spot before we open to the public.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--color-ink-primary)",
                        marginBottom: 6,
                      }}
                    >
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      className="input"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "12px",
                      justifyContent: "center",
                      fontSize: "1rem",
                    }}
                  >
                    {loading ? (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          className="animate-spin"
                          width="15"
                          height="15"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeOpacity="0.25"
                          />
                          <path
                            d="M12 2a10 10 0 0110 10"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>
                        Joining…
                      </span>
                    ) : (
                      "Request early access →"
                    )}
                  </button>

                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-ink-ghost)",
                      textAlign: "center",
                    }}
                  >
                    No credit card required · Unsubscribe anytime
                  </p>
                </form>

                {/* Trust badges */}
                <div
                  style={{
                    marginTop: 28,
                    paddingTop: 24,
                    borderTop: "1px solid var(--color-border-subtle)",
                    display: "flex",
                    gap: 16,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    { icon: "🔒", text: "Secure & private" },
                    { icon: "⚡", text: "Instant access" },
                    { icon: "🌍", text: "East Africa first" },
                  ].map((badge) => (
                    <div
                      key={badge.text}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span style={{ fontSize: "0.875rem" }}>{badge.icon}</span>
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--color-ink-tertiary)",
                        }}
                      >
                        {badge.text}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

// ─── 8. FAQ ───────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "Is it really free to start?",
    a: "Yes — the free plan includes 1 shop, unlimited sales, full inventory tracking, and basic reports. Pro unlocks multiple shops, advanced analytics, and priority support.",
  },
  {
    q: "Does it work without internet?",
    a: "Yes. AutoShop Pro is built offline-first. Sales and stock changes are saved locally and synced automatically the moment you reconnect.",
  },
  {
    q: "Can I add staff members to my shop?",
    a: "Yes. Invite staff and they get a simplified POS-only interface. Owners have full access; staff see only what they need to do their job.",
  },
  {
    q: "What devices does it work on?",
    a: "Any modern browser — phone, tablet, or computer. Install it as a PWA for a full native app experience with push notifications and offline support.",
  },
  {
    q: "How do I add my existing products?",
    a: "Add products manually or bulk-import via CSV (Pro plan). Most shops finish setup in under an hour.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Data is stored on Supabase (PostgreSQL) with row-level security — only you and your authorised staff can access it. Automatic backups run daily.",
  },
];

function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section
      id="faq"
      style={{ padding: "88px 0", background: "var(--color-surface-0)" }}
    >
      <Container>
        <SectionHead
          eyebrow="FAQ"
          title="Common questions"
          subtitle="Everything you need to know before getting started."
        />
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {faqs.map((item, i) => (
            <div
              key={item.q}
              style={{
                borderRadius: openIdx === i ? "var(--radius-lg)" : 0,
                background:
                  openIdx === i ? "var(--color-surface-1)" : "transparent",
                border:
                  openIdx === i ? "1px solid var(--color-border)" : "none",
                borderBottom:
                  openIdx === i
                    ? undefined
                    : "1px solid var(--color-border-subtle)",
                marginBottom: openIdx === i ? 8 : 0,
                transition: "all 0.2s var(--ease-smooth)",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: openIdx === i ? "20px 20px 0" : "20px 0",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background:
                        openIdx === i
                          ? "var(--color-brand-500)"
                          : "var(--color-surface-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "background 0.2s",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        color:
                          openIdx === i ? "white" : "var(--color-ink-tertiary)",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "0.9375rem",
                      color: "var(--color-ink-primary)",
                    }}
                  >
                    {item.q}
                  </span>
                </div>
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                  style={{
                    flexShrink: 0,
                    color: "var(--color-ink-tertiary)",
                    transform:
                      openIdx === i ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.25s var(--ease-smooth)",
                  }}
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {openIdx === i && (
                <p
                  style={{
                    padding: "14px 20px 20px 62px",
                    fontSize: "0.9375rem",
                    color: "var(--color-ink-secondary)",
                    lineHeight: 1.75,
                  }}
                >
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ─── 9. Final CTA ─────────────────────────────────────────────────────────────

function FinalCTASection() {
  return (
    <section
      style={{
        padding: "100px 0",
        background: "var(--color-brand-600)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: "white",
          opacity: 0.05,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: -60,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "white",
          opacity: 0.05,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "white",
          opacity: 0.03,
          pointerEvents: "none",
        }}
      />

      <Container style={{ position: "relative", textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            color: "rgba(255,255,255,0.9)",
            marginBottom: 24,
          }}
        >
          Get started today
        </span>

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
            color: "white",
            lineHeight: 1.1,
            maxWidth: 640,
            margin: "0 auto 20px",
          }}
        >
          Ready to take control of your shop?
        </h2>
        <p
          style={{
            fontSize: "1.125rem",
            color: "rgba(255,255,255,0.75)",
            maxWidth: 460,
            margin: "0 auto 40px",
            lineHeight: 1.72,
          }}
        >
          Join hundreds of shop owners who run smoother, faster businesses with
          AutoShop Pro.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <Link
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 36px",
              borderRadius: "var(--radius-md)",
              background: "white",
              color: "var(--color-brand-600)",
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
            }}
          >
            Get Started Free
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <a
            href="#waitlist"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "14px 36px",
              borderRadius: "var(--radius-md)",
              background: "transparent",
              border: "1.5px solid rgba(255,255,255,0.4)",
              color: "white",
              fontWeight: 600,
              fontSize: "1rem",
              textDecoration: "none",
            }}
          >
            Join waitlist
          </a>
        </div>

        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)" }}>
          No credit card required · Free plan available · Cancel anytime
        </p>
      </Container>
    </section>
  );
}

// ─── 10. Footer ───────────────────────────────────────────────────────────────

function FooterSection() {
  const footerCols = [
    {
      heading: "Product",
      links: [
        { href: "#features", label: "Features" },
        { href: "#how-it-works", label: "How It Works" },
        { href: "#faq", label: "FAQ" },
        { href: "#waitlist", label: "Early Access" },
      ],
    },
    {
      heading: "Account",
      links: [
        { href: "/login", label: "Log in" },
        { href: "/signup", label: "Sign up free" },
        { href: "/setup", label: "Setup your shop" },
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

  return (
    <footer
      style={{
        background: "var(--color-surface-0)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <Container>
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-10"
          style={{ paddingTop: 64, paddingBottom: 56 }}
        >
          <div className="col-span-2 lg:col-span-1">
            <Image
              src="/logo.png"
              alt="AutoShop Pro"
              width={160}
              height={32}
              style={{ marginBottom: 16 }}
              className="h-8 w-auto dark:brightness-0 dark:invert"
            />
            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--color-ink-tertiary)",
                lineHeight: 1.7,
                marginBottom: 24,
                maxWidth: 260,
              }}
            >
              Offline-first inventory and POS built for automotive parts shops
              across East Africa.
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 999,
                background: "var(--color-success-light)",
                border: "1px solid var(--color-success)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--color-success)",
                  display: "inline-block",
                  boxShadow: "0 0 0 2px var(--color-success-light)",
                }}
              />
              <span
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--color-success-text)",
                }}
              >
                All systems operational
              </span>
            </div>
          </div>

          {footerCols.map((col) => (
            <div key={col.heading}>
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  color: "var(--color-ink-primary)",
                  marginBottom: 18,
                }}
              >
                {col.heading}
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      style={{
                        fontSize: "0.9375rem",
                        color: "var(--color-ink-tertiary)",
                        textDecoration: "none",
                      }}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid var(--color-border-subtle)",
            paddingTop: 24,
            paddingBottom: 32,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-ghost)" }}>
            © {new Date().getFullYear()} AutoShop Pro. All rights reserved.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["🇰🇪 Kenya", "🇺🇬 Uganda", "🇹🇿 Tanzania"].map((region) => (
              <span
                key={region}
                style={{
                  fontSize: "0.75rem",
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: "var(--color-surface-2)",
                  color: "var(--color-ink-secondary)",
                  fontWeight: 500,
                }}
              >
                {region}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <LandingNav />
      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <WaitlistSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <FooterSection />
    </div>
  );
}
