interface ChannelProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  href: string;
  cta: string;
}

function Channel({ icon, label, value, sub, href, cta }: ChannelProps) {
  return (
    <div
      style={{
        padding: "28px 24px",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        background: "var(--color-surface-0)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--radius-md)",
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(139,92,246,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-brand-600)",
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-ink-tertiary)",
            marginBottom: 4,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--color-ink-primary)",
            marginBottom: 2,
          }}
        >
          {value}
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--color-ink-tertiary)" }}>
          {sub}
        </p>
      </div>
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className="btn btn-secondary btn-sm"
        style={{ alignSelf: "flex-start" }}
      >
        {cta}
      </a>
    </div>
  );
}

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const EmailIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <path
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FaqIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <path
      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function ContactChannels({ className }: { className?: string }) {
  return (
    <div className={className ?? "grid grid-cols-1 sm:grid-cols-3 gap-5 mb-16"}>
      <Channel
        label="WhatsApp"
        value="+254 799 964 428"
        sub="Mon – Sat · 8 am – 8 pm EAT. Fastest response."
        href="https://wa.me/254799964428?text=Hi!%20I%20need%20help%20with%20AutoShop%20Pro."
        cta="Open WhatsApp"
        icon={<WhatsAppIcon />}
      />
      <Channel
        label="Email"
        value="support@autoshoppro.com"
        sub="We reply within 1 business day."
        href="mailto:support@autoshoppro.com"
        cta="Send email"
        icon={<EmailIcon />}
      />
      <Channel
        label="FAQ"
        value="Common questions"
        sub="Check if your question is already answered."
        href="/#faq"
        cta="Browse FAQ"
        icon={<FaqIcon />}
      />
    </div>
  );
}
