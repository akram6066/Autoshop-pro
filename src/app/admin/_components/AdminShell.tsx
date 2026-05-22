"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";

interface Props {
  children: React.ReactNode;
  adminName: string;
}

export function AdminShell({ children, adminName }: Props) {
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    function check() {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // auto-collapse on mobile, auto-open on desktop
      setOpen((prev) => {
        if (mobile) return false;
        // only auto-open if we just crossed to desktop
        if (!mobile && !prev && window.innerWidth >= 1024) return true;
        return prev;
      });
    }
    check();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, open]);

  const transition = mounted
    ? "transform 0.28s cubic-bezier(0.4,0,0.2,1)"
    : "none";
  const mlTransition = mounted
    ? "margin-left 0.28s cubic-bezier(0.4,0,0.2,1)"
    : "none";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      {/* ── Backdrop (mobile only) ──────────────────────────────── */}
      {mounted && isMobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.55)",
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
            zIndex: 39,
            animation: "fadeIn 0.2s ease both",
          }}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: 240,
          zIndex: 40,
          transform: open ? "translateX(0)" : "translateX(-240px)",
          transition,
          boxShadow: open && isMobile ? "8px 0 32px rgba(0,0,0,0.22)" : "none",
        }}
      >
        <AdminSidebar adminName={adminName} onClose={() => setOpen(false)} />
      </div>

      {/* ── Main content ────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          marginLeft: mounted && !isMobile && open ? 240 : 0,
          transition: mlTransition,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Sticky top bar — only visible when sidebar is closed (or always on mobile) */}
        {mounted && !open && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              height: 52,
              background: "rgba(248,250,252,0.92)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              paddingLeft: 12,
              zIndex: 30,
              animation: "fadeIn 0.15s ease both",
            }}
          >
            <button
              onClick={() => setOpen(true)}
              aria-label="Open sidebar"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#0f172a",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "white",
                flexShrink: 0,
              }}
            >
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
                <path
                  d="M3 6h18M3 12h18M3 18h18"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <span
              style={{
                marginLeft: 12,
                fontSize: "0.875rem",
                fontWeight: 700,
                color: "#0f172a",
                letterSpacing: "-0.01em",
              }}
            >
              Admin Panel
            </span>
          </div>
        )}

        <main
          style={{
            flex: 1,
            overflow: "auto",
            // Push content below top bar when sidebar is closed
            paddingTop: mounted && !open ? 52 : 0,
            transition: mounted ? "padding-top 0.15s ease" : "none",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
