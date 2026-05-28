import Container from "./Container";
import SectionHead from "./SectionHead";
import { RevealOnScroll } from "./RevealOnScroll";

const shopTypes = [
  {
    name: "Clothing & Fashion",
    examples: "Boutiques, second-hand shops, fabric stores",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.86H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.86l.58-3.57a2 2 0 00-1.33-2.11z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "Electronics",
    examples: "Phone shops, accessories, repair centres",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect
          x="5"
          y="2"
          width="14"
          height="20"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M12 18h.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    name: "Hardware & Tools",
    examples: "Building materials, plumbing, electrical supplies",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "Pharmacy & Health",
    examples: "Chemists, medical supplies, beauty products",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M8 3h8v5h5v8h-5v5H8v-5H3V8h5V3z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "Auto Parts",
    examples: "Tyres, batteries, rims, spare parts",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M5 17H3a2 2 0 01-2-2V9l3-4h14l3 4v6a2 2 0 01-2 2h-2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="7.5"
          cy="17.5"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <circle
          cx="16.5"
          cy="17.5"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.75"
        />
      </svg>
    ),
  },
  {
    name: "Grocery & General",
    examples: "Supermarkets, kiosks, general merchandise",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="3"
          y1="6"
          x2="21"
          y2="6"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M16 10a4 4 0 01-8 0"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    name: "Shoes & Bags",
    examples: "Footwear shops, handbags, accessories",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M6 2h12l2 7H4L6 2z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 9v11a2 2 0 002 2h12a2 2 0 002-2V9"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M9 9V7a3 3 0 016 0v2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    name: "Furniture & Home",
    examples: "Furniture stores, homeware, décor shops",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M20 9V7a2 2 0 00-2-2H6a2 2 0 00-2 2v2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <rect
          x="2"
          y="11"
          width="20"
          height="6"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M6 17v2M18 17v2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function WhoItsForSection() {
  return (
    <section
      style={{
        padding: "96px 0",
        background: "var(--color-surface-0)",
        borderTop: "1px solid var(--color-border-subtle)",
      }}
    >
      <Container>
        <RevealOnScroll>
          <SectionHead
            eyebrow="Who it's for"
            title="Built for any shop that sells products"
            subtitle="If you have stock to track and sales to record, AutoShop Pro works for you — no matter what you sell."
          />
        </RevealOnScroll>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {shopTypes.map((s, i) => (
            <RevealOnScroll key={s.name} delay={i * 50}>
              <div
                className="shop-card"
                style={{
                  padding: "24px 20px",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface-0)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  height: "100%",
                  transition: "box-shadow 0.18s, border-color 0.18s",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(59,110,245,0.08)",
                    color: "var(--color-brand-500)",
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>
                <div>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9375rem",
                      color: "var(--color-ink-primary)",
                      marginBottom: 4,
                    }}
                  >
                    {s.name}
                  </p>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-ink-tertiary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {s.examples}
                  </p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        {/* Bottom note */}
        <RevealOnScroll delay={200}>
          <div
            style={{
              marginTop: 48,
              padding: "24px 28px",
              borderRadius: "var(--radius-lg)",
              background:
                "linear-gradient(135deg, rgba(59,110,245,0.06) 0%, rgba(139,92,246,0.06) 100%)",
              border: "1px solid rgba(139,92,246,0.12)",
            }}
          >
            <p
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                color: "var(--color-ink-primary)",
                marginBottom: 4,
              }}
            >
              Don&apos;t see your shop type?
            </p>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--color-ink-secondary)",
                marginBottom: 16,
              }}
            >
              If you sell physical products and need to track stock, AutoShop
              Pro works for you.
            </p>
            <a
              href="https://wa.me/254799964428?text=Hi!%20I%20want%20to%20know%20if%20AutoShop%20Pro%20works%20for%20my%20shop."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: "var(--radius-md)",
                background: "#25D366",
                color: "white",
                fontWeight: 700,
                fontSize: "0.9375rem",
                textDecoration: "none",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="white"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Ask us on WhatsApp
            </a>
          </div>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
