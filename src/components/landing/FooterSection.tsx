import Image from "next/image";
import Container from "./Container";

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
              src="/logo.svg"
              alt="AutoShop Pro"
              width={260}
              height={60}
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

export default FooterSection;
