"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function StickyMobileCTA() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 480);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed) return null;

  return (
    <div
      className={`sticky-cta-bar md:hidden${show ? " show" : ""}`}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        flexDirection: "row-reverse",
        gap: 10,
        padding: "12px 16px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        background: "linear-gradient(135deg, #3b6ef5 0%, #7c3aed 100%)",
        borderTop: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 -8px 32px rgba(59,110,245,0.25)",
      }}
    >
      <Link
        href="/signup"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "13px 0",
          borderRadius: 10,
          background: "white",
          color: "#3b6ef5",
          fontWeight: 700,
          fontSize: "0.9375rem",
          textDecoration: "none",
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
        }}
      >
        Start for free — no credit card
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
