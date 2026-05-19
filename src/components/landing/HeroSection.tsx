"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Container from "./Container";

const ROTATING_WORDS = [
  "Auto Shop",
  "Spare Parts Store",
  "Tires Shop",
  "Battery Shop",
  "Auto Business",
];

type Phase = "typing" | "paused" | "deleting";

function useTypewriter(words: string[]) {
  const [displayed, setDisplayed] = useState(words[0]);
  const [wordIdx, setWordIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("paused");

  useEffect(() => {
    const current = words[wordIdx];

    if (phase === "paused") {
      const t = setTimeout(() => setPhase("deleting"), 2200);
      return () => clearTimeout(t);
    }

    if (phase === "deleting") {
      if (displayed.length === 0) {
        const t = setTimeout(() => {
          setWordIdx((i) => (i + 1) % words.length);
          setPhase("typing");
        }, 120);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setDisplayed((d) => d.slice(0, -1)), 38);
      return () => clearTimeout(t);
    }

    // typing
    if (displayed === current) {
      const t = setTimeout(() => setPhase("paused"), 50);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setDisplayed(current.slice(0, displayed.length + 1)),
      85,
    );
    return () => clearTimeout(t);
  }, [displayed, wordIdx, phase, words]);

  return displayed;
}

function HeroSection() {
  const typedText = useTypewriter(ROTATING_WORDS);

  return (
    <section
      className="pt-16 sm:pt-20 pb-12 sm:pb-20"
      style={{
        background: "linear-gradient(160deg, #eef2ff 0%, #f5f0ff 100%)",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      {/* Radial glow at top-center */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background:
            "radial-gradient(ellipse 90% 70% at 50% -5%, #dce6fe 0%, #ede9fe 45%, transparent 72%)",
          pointerEvents: "none",
        }}
      />
      {/* Dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />
      {/* Left glow — blue */}
      <div
        className="h-glow"
        style={{
          position: "absolute",
          top: 60,
          left: -160,
          zIndex: 0,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "#bacffe",
          opacity: 0.35,
          filter: "blur(64px)",
          pointerEvents: "none",
        }}
      />
      {/* Right glow — violet */}
      <div
        className="h-glow"
        style={{
          position: "absolute",
          top: 40,
          right: -160,
          zIndex: 0,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "#c4b5fd",
          opacity: 0.3,
          filter: "blur(64px)",
          pointerEvents: "none",
          animationDelay: "3s",
        }}
      />

      <Container style={{ position: "relative", zIndex: 1 }}>
        {/* ── Top content ── */}
        <div
          style={{
            textAlign: "center",
            paddingBottom: 40,
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Pill badge */}
          <div className="h-badge" style={{ marginBottom: 28 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 18px",
                borderRadius: 999,
                background: "white",
                border: "1px solid rgba(99,102,241,0.2)",
                boxShadow: "0 1px 8px rgba(99,102,241,0.1)",
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

          {/* Headline with typing animation */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.75rem, 6vw, 4.5rem)",
              lineHeight: 1.06,
              maxWidth: 820,
              margin: "0 auto 28px",
              letterSpacing: "-0.02em",
            }}
          >
            <span
              className="h-line1"
              style={{ display: "block", color: "var(--color-ink-primary)" }}
            >
              Run your
            </span>

            <span
              className="h-line2"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "1.15em",
              }}
            >
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #3b6ef5 0%, #8b5cf6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {typedText}
              </span>
              <span className="h-cursor" aria-hidden="true" />
            </span>

            <span
              className="h-line3"
              style={{ display: "block", color: "var(--color-ink-primary)" }}
            >
              like a modern business.
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="h-sub"
            style={{
              fontSize: "1.1875rem",
              color: "var(--color-ink-secondary)",
              maxWidth: 520,
              margin: "0 auto 32px",
              lineHeight: 1.78,
            }}
          >
            Inventory, POS, staff management and reports — all in one place,
            even when the internet goes out.
          </p>

          {/* CTAs */}
          <div
            className="h-cta"
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 28,
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
                background: "linear-gradient(135deg, #3b6ef5 0%, #8b5cf6 100%)",
                color: "white",
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                boxShadow:
                  "0 4px 20px rgba(99,102,241,0.35), 0 1px 4px rgba(59,110,245,0.2)",
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
                border: "1.5px solid rgba(99,102,241,0.18)",
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
            className="h-trust"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", marginRight: 4 }}>
              {[
                "var(--color-brand-500)",
                "var(--color-success)",
                "var(--color-warning)",
                "#8b5cf6",
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
                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
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

        {/* ── Dashboard screenshot — hidden on mobile ── */}
        <div
          className="hero-preview-wrap"
          style={{ position: "relative", maxWidth: 960, margin: "0 auto" }}
        >
          {/* Floating stat card — Revenue */}
          <div
            className="h-card1 hidden sm:block"
            style={{
              position: "absolute",
              top: 40,
              left: -20,
              zIndex: 10,
            }}
          >
            <div
              className="h-float1"
              style={{
                background: "white",
                borderRadius: "var(--radius-lg)",
                padding: "14px 18px",
                boxShadow:
                  "0 8px 32px rgba(99,102,241,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                border: "1px solid rgba(99,102,241,0.1)",
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
          </div>

          {/* Floating stat card — Stock Alert */}
          <div
            className="h-card2 hidden sm:block"
            style={{
              position: "absolute",
              top: 40,
              right: -20,
              zIndex: 10,
            }}
          >
            <div
              className="h-float2"
              style={{
                background: "white",
                borderRadius: "var(--radius-lg)",
                padding: "14px 18px",
                boxShadow:
                  "0 8px 32px rgba(99,102,241,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                border: "1px solid rgba(99,102,241,0.1)",
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
          </div>

          {/* Floating card — Sale recorded */}
          <div
            className="h-card3 hidden lg:block"
            style={{
              position: "absolute",
              bottom: 40,
              left: -16,
              zIndex: 10,
            }}
          >
            <div
              className="h-float3"
              style={{
                background: "white",
                borderRadius: "var(--radius-lg)",
                padding: "12px 16px",
                boxShadow:
                  "0 8px 32px rgba(99,102,241,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                border: "1px solid rgba(99,102,241,0.1)",
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
          </div>

          {/* Browser frame */}
          <div
            className="hero-screen"
            style={{
              width: "100%",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              border: "1px solid rgba(99,102,241,0.15)",
              boxShadow:
                "0 32px 100px -16px rgba(99,102,241,0.22), 0 8px 32px rgba(0,0,0,0.08)",
              background: "var(--color-surface-0)",
            }}
          >
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
            <div className="hero-dash-clip">
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
        </div>

        {/* ── Stats bar ── */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-px hero-stats-bar"
          style={{
            background: "rgba(99,102,241,0.12)",
            overflow: "hidden",
            marginTop: 20,
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
              className="hero-stat-cell"
              style={{ background: "white" }}
            >
              <p
                style={{
                  fontWeight: 800,
                  fontSize: "1.25rem",
                  background: "linear-gradient(135deg, #3b6ef5, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
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

export default HeroSection;
