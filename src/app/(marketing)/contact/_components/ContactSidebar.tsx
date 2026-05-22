import Link from "next/link";

function FaqItem({ q, a, href }: { q: string; a: string; href?: string }) {
  return (
    <div
      style={{
        padding: "20px 0",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <p
        style={{
          fontWeight: 600,
          fontSize: "0.9375rem",
          color: "var(--color-ink-primary)",
          marginBottom: 6,
        }}
      >
        {q}
      </p>
      <p
        style={{
          fontSize: "0.9375rem",
          color: "var(--color-ink-secondary)",
          lineHeight: 1.7,
        }}
      >
        {a}{" "}
        {href && (
          <Link href={href} style={{ color: "var(--color-brand-600)" }}>
            Learn more →
          </Link>
        )}
      </p>
    </div>
  );
}

export function ContactSidebar() {
  return (
    <div>
      <h2
        style={{
          fontSize: "1.125rem",
          fontWeight: 700,
          color: "var(--color-ink-primary)",
          marginBottom: 4,
        }}
      >
        Quick answers
      </h2>
      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--color-ink-tertiary)",
          marginBottom: 20,
        }}
      >
        Most questions are answered here.
      </p>

      <div>
        <FaqItem
          q="How do I reset my password?"
          a="Go to the login page and click 'Forgot password?' — we'll email you a reset link within a minute."
        />
        <FaqItem
          q="Can AutoShop Pro work without internet?"
          a="Yes. Sales, inventory, and POS all work offline. Data syncs automatically when you reconnect."
        />
        <FaqItem
          q="How do I add staff members?"
          a="Go to Settings → Team, then invite your staff by email. They'll get an account linked to your shop."
        />
        <FaqItem
          q="Can I manage more than one shop?"
          a="Yes — you can switch between shops from the top navigation bar. Each shop has its own inventory and staff."
        />
        <FaqItem
          q="Is my data safe if I clear my browser?"
          a="All data syncs to the cloud as soon as you're online. Clearing your browser only removes the local cache — your data is safe in your account."
        />
      </div>

      <div
        style={{
          marginTop: 28,
          padding: "20px",
          borderRadius: "var(--radius-lg)",
          background: "rgba(99,102,241,0.05)",
          border: "1px solid rgba(139,92,246,0.15)",
        }}
      >
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--color-ink-primary)",
            marginBottom: 4,
          }}
        >
          Business hours
        </p>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-ink-secondary)",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          Monday – Saturday
          <br />
          8:00 am – 8:00 pm East Africa Time (EAT)
          <br />
          <span
            style={{
              color: "var(--color-ink-tertiary)",
              fontSize: "0.8125rem",
            }}
          >
            Closed on public holidays
          </span>
        </p>
      </div>
    </div>
  );
}
