"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "./Container";

const footerCols = [
  {
    heading: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#how-it-works", label: "How It Works" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/#faq", label: "FAQ" },
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
      { href: "/contact", label: "Contact & Support" },
    ],
  },
];

const socials = [
  {
    label: "Facebook",
    href: "https://facebook.com/autoshoppro",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com/autoshoppro",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="5"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <circle
          cx="12"
          cy="12"
          r="4"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://tiktok.com/@autoshoppro",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M9 12a4 4 0 104 4V4a5 5 0 005 5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/autoshoppro",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="2"
          y="9"
          width="4"
          height="12"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    ),
  },
];

function FooterSection() {
  const pathname = usePathname();
  return (
    <footer>
      {/* ── Main body — light gradient, dark logo ── */}
      <div
        style={{
          background: "linear-gradient(160deg, #eef2ff 0%, #f5f0ff 100%)",
          borderTop: "1px solid rgba(139,92,246,0.1)",
        }}
      >
        <Container>
          <div
            className="grid grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-10"
            style={{ paddingTop: 52, paddingBottom: 44 }}
          >
            {/* ── Brand column ── */}
            <div
              className="col-span-2 lg:col-span-1"
              style={{ paddingBottom: 8 }}
            >
              {/* Dark logo for light background */}
              <Image
                src="/logo.svg"
                alt="AutoShop Pro"
                width={120}
                height={32}
                style={{ marginBottom: 16, width: "auto" }}
                className="h-8 w-auto"
              />
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-ink-tertiary)",
                  lineHeight: 1.75,
                  marginBottom: 24,
                  maxWidth: 260,
                }}
              >
                Offline-first inventory and POS built for any shop, anywhere in
                the world.
              </p>

              {/* Status badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 13px",
                  borderRadius: 999,
                  background: "var(--color-success-light)",
                  border: "1px solid var(--color-success)",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--color-success)",
                    display: "inline-block",
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

              {/* WhatsApp */}
              <div>
                <a
                  href="https://wa.me/254799964428?text=Hi!%20I%27m%20interested%20in%20AutoShop%20Pro."
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 14px",
                    borderRadius: 999,
                    background: "#f0fdf4",
                    border: "1px solid rgba(37,211,102,0.3)",
                    color: "#15803d",
                    textDecoration: "none",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="#25D366"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  +254 799 964 428
                </a>
              </div>
            </div>

            {/* ── Divider between brand and links on mobile ── */}
            <div
              className="col-span-2 lg:hidden"
              style={{
                height: 1,
                background: "rgba(139,92,246,0.1)",
                margin: "0 0 4px",
              }}
            />

            {/* ── Link columns ── */}
            {footerCols.map((col) => (
              <div key={col.heading}>
                <p
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase" as const,
                    color: "var(--color-ink-primary)",
                    marginBottom: 20,
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
                    gap: 13,
                  }}
                >
                  {col.links.map((l) => {
                    const isActive = pathname === l.href;
                    return (
                      <li key={l.label}>
                        <Link
                          href={l.href}
                          style={{
                            fontSize: "0.9375rem",
                            color: isActive
                              ? "var(--color-brand-600)"
                              : "var(--color-ink-tertiary)",
                            textDecoration: "none",
                            fontWeight: isActive ? 600 : 400,
                          }}
                        >
                          {l.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            {/* ── Social / Connect column ── */}
            <div className="col-span-2 lg:col-span-1">
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase" as const,
                  color: "var(--color-ink-primary)",
                  marginBottom: 20,
                }}
              >
                Follow Us
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginBottom: 28,
                }}
              >
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 12px",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(99,102,241,0.07)",
                      border: "1px solid rgba(139,92,246,0.12)",
                      color: "var(--color-brand-600)",
                      textDecoration: "none",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                    }}
                  >
                    {s.icon}
                    {s.label}
                  </a>
                ))}
              </div>

              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase" as const,
                  color: "var(--color-ink-primary)",
                  marginBottom: 10,
                }}
              >
                Contact
              </p>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-ink-tertiary)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Available on WhatsApp
                <br />
                Mon – Sat · 8 am – 8 pm EAT
              </p>
            </div>
          </div>

          {/* ── Bottom bar ── */}
          <div
            style={{
              borderTop: "1px solid rgba(139,92,246,0.1)",
              paddingTop: 20,
              paddingBottom: 28,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-ink-ghost)",
                margin: 0,
              }}
            >
              © {new Date().getFullYear()} AutoShop Pro. All rights reserved.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {[
                { href: "/privacy", label: "Privacy" },
                { href: "/terms", label: "Terms" },
                { href: "/contact", label: "Contact" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-ink-ghost)",
                    textDecoration: "none",
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}

export default FooterSection;
