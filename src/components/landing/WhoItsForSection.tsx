import Container from "./Container";
import SectionHead from "./SectionHead";
import { RevealOnScroll } from "./RevealOnScroll";

const shopTypes = [
  {
    emoji: "👗",
    name: "Clothing & Fashion",
    examples: "Boutiques, second-hand shops, fabric stores",
  },
  {
    emoji: "📱",
    name: "Electronics",
    examples: "Phone shops, accessories, repair centres",
  },
  {
    emoji: "🔧",
    name: "Hardware & Tools",
    examples: "Building materials, plumbing, electrical supplies",
  },
  {
    emoji: "💊",
    name: "Pharmacy & Health",
    examples: "Chemists, medical supplies, beauty products",
  },
  {
    emoji: "🚗",
    name: "Auto Parts",
    examples: "Tyres, batteries, rims, spare parts",
  },
  {
    emoji: "🛒",
    name: "Grocery & General",
    examples: "Supermarkets, kiosks, general merchandise",
  },
  {
    emoji: "👟",
    name: "Shoes & Bags",
    examples: "Footwear shops, handbags, accessories",
  },
  {
    emoji: "🪑",
    name: "Furniture & Home",
    examples: "Furniture stores, homeware, décor shops",
  },
];

export default function WhoItsForSection() {
  return (
    <section
      style={{
        padding: "88px 0",
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
                  background: "var(--color-surface-1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  height: "100%",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ fontSize: "2rem", lineHeight: 1 }}
                >
                  {s.emoji}
                </span>
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
                fontSize: "0.9rem",
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
