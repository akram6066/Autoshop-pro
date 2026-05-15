import Image from "next/image";

export default function BrandPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between"
      style={{
        width: "42%",
        flexShrink: 0,
        padding: "52px 48px",
        background: "var(--color-brand-600)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "var(--color-brand-500)",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -50,
          left: -50,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "var(--color-brand-700)",
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative" }}>
        <Image
          src="/logo.svg"
          alt="AutoShop Pro"
          width={260}
          height={60}
          className="h-9 w-auto brightness-0 invert mb-12"
          priority
        />

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.75rem, 2.5vw, 2.375rem)",
            color: "white",
            lineHeight: 1.2,
            marginBottom: 12,
          }}
        >
          Welcome back
        </h2>
        <p
          style={{
            fontSize: "1rem",
            color: "rgba(255,255,255,0.72)",
            lineHeight: 1.72,
            marginBottom: 40,
          }}
        >
          Sign in to continue managing your shop inventory and sales.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            "Manage inventory across all branches",
            "Record sales online and offline",
            "Track staff activity in real time",
            "Reports and low-stock alerts built in",
          ].map((point) => (
            <div
              key={point}
              style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24">
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
                  color: "rgba(255,255,255,0.83)",
                  lineHeight: 1.5,
                }}
              >
                {point}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof */}
      <div
        style={{
          position: "relative",
          borderTop: "1px solid rgba(255,255,255,0.15)",
          paddingTop: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex" }}>
            {["var(--color-brand-400)", "#16a34a", "#d97706"].map((bg, i) => (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: bg,
                  border: "2px solid rgba(255,255,255,0.3)",
                  marginLeft: i === 0 ? 0 : -10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
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
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.65)",
              marginLeft: 4,
            }}
          >
            50+ shops across East Africa
          </p>
        </div>
      </div>
    </div>
  );
}
