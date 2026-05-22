import Image from "next/image";

export default function HeroBrowserFrame() {
  return (
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
      {/* Browser chrome */}
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

      {/* Screenshot */}
      <div className="hero-dash-clip">
        <Image
          src="/dashboard.png"
          alt="AutoShop Pro dashboard"
          width={960}
          height={540}
          sizes="(min-width: 1280px) 900px, (min-width: 768px) 85vw, 100vw"
          className="w-full h-auto block"
          priority
        />
      </div>
    </div>
  );
}
