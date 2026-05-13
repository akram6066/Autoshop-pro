import Image from "next/image";

const features = [
  {
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
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
    label: "1 shop free",
    sub: "No credit card required",
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
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
    label: "Works offline",
    sub: "Syncs automatically when online",
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path
          d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    label: "Set up in minutes",
    sub: "No IT expertise needed",
  },
  {
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <circle
          cx="18"
          cy="18"
          r="3"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M13 6h3a2 2 0 012 2v7M11 18H8a2 2 0 01-2-2V9"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
    label: "Multi-branch ready",
    sub: "Manage all locations from one account",
  },
];

const stats = [
  { value: "50+", label: "Active shops" },
  { value: "3", label: "Cities covered" },
  { value: "100%", label: "Offline capable" },
  { value: "Free", label: "To start, always" },
];

function BrandPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between"
      style={{
        width: "42%",
        flexShrink: 0,
        padding: "48px 44px",
        background: "var(--color-brand-900, #1e1b4b)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "var(--color-brand-800, #312e81)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -50,
          left: -40,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "var(--color-brand-800, #312e81)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "45%",
          left: -80,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "var(--color-brand-600, #4338ca)",
          opacity: 0.25,
          pointerEvents: "none",
        }}
      />

      {/* Top content */}
      <div style={{ position: "relative" }}>
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--radius-md)",
              background: "var(--color-brand-500)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
                stroke="white"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <p
              style={{
                fontSize: "0.9375rem",
                fontWeight: 700,
                color: "white",
                lineHeight: 1.2,
              }}
            >
              AutoShop Pro
            </p>
            <p
              style={{
                fontSize: "0.6875rem",
                color: "var(--color-brand-200, #a5b4fc)",
                marginTop: 1,
              }}
            >
              Parts &amp; Accessories Management
            </p>
          </div>
        </div>

        {/* Heading */}
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.625rem, 2.5vw, 2.25rem)",
            color: "white",
            lineHeight: 1.2,
            marginBottom: 10,
          }}
        >
          Start managing smarter
        </h2>
        <p
          style={{
            fontSize: "0.9375rem",
            color: "var(--color-brand-200, #a5b4fc)",
            lineHeight: 1.75,
            marginBottom: 32,
          }}
        >
          Join shop owners across East Africa who manage inventory and sales
          with AutoShop Pro.
        </p>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {features.map((item, i) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                paddingTop: 14,
                paddingBottom: 14,
                borderBottom:
                  i < features.length - 1
                    ? "1px solid rgba(165,180,252,0.1)"
                    : "none",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: "rgba(79,70,229,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "var(--color-brand-200, #a5b4fc)",
                }}
              >
                {item.icon}
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "white",
                    lineHeight: 1.3,
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-brand-300, #818cf8)",
                    marginTop: 2,
                  }}
                >
                  {item.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom content */}
      <div style={{ position: "relative" }}>
        {/* Stats grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(165,180,252,0.12)",
                borderRadius: "var(--radius-md)",
                padding: "14px 16px",
              }}
            >
              <p
                style={{ fontSize: "1.25rem", fontWeight: 700, color: "white" }}
              >
                {s.value}
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-brand-300, #818cf8)",
                  marginTop: 2,
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 20,
            borderTop: "1px solid rgba(165,180,252,0.1)",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-brand-400, #6366f1)",
            }}
          >
            AutoShop Pro · Offline-first shop management
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--color-success)",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "var(--color-success)",
              }}
            >
              Live now
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrandPanel;
