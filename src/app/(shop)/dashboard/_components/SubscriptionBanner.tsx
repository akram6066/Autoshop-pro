import Link from "next/link";

interface SubscriptionBannerProps {
  subActive: boolean;
  subDays: number;
  bannerUrgent: boolean;
}

export function SubscriptionBanner({
  subActive,
  subDays,
  bannerUrgent,
}: SubscriptionBannerProps) {
  const bg = !subActive
    ? "var(--color-danger-light)"
    : bannerUrgent
      ? "var(--color-orange-bg)"
      : "var(--color-warning-bg)";

  const border = !subActive
    ? "var(--color-danger)"
    : bannerUrgent
      ? "var(--color-orange-border)"
      : "var(--color-warning-border)";

  const iconBg = !subActive
    ? "var(--color-danger-light)"
    : bannerUrgent
      ? "var(--color-orange-bg)"
      : "var(--color-warning-light)";

  const iconColor = !subActive
    ? "var(--color-danger)"
    : bannerUrgent
      ? "var(--color-orange-text)"
      : "var(--color-warning)";

  const titleColor = !subActive
    ? "var(--color-danger)"
    : bannerUrgent
      ? "var(--color-orange-text)"
      : "var(--color-warning-text-strong)";

  const bodyColor = !subActive
    ? "var(--color-danger-text)"
    : "var(--color-warning-text-strong)";

  const ctaBg = !subActive
    ? "var(--color-danger)"
    : bannerUrgent
      ? "var(--color-orange-text)"
      : "var(--color-warning)";

  return (
    <div
      className="animate-fade-in-up"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 10,
        marginBottom: 24,
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: iconBg,
          color: iconColor,
        }}
      >
        {!subActive ? (
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="1.75"
            />
            <path
              d="M12 6v6l4 2"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: titleColor,
            marginBottom: 1,
          }}
        >
          {!subActive
            ? "Your free trial has expired"
            : subDays <= 5
              ? `Trial expires in ${subDays} day${subDays !== 1 ? "s" : ""}!`
              : `${subDays} days left in your free trial`}
        </p>
        <p style={{ fontSize: "0.8125rem", color: bodyColor }}>
          {!subActive
            ? "Upgrade to keep all features — pay via M-Pesa."
            : "Upgrade now — from KES 1,000/month via M-Pesa."}
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/billing?plan=pro"
        style={{
          flexShrink: 0,
          padding: "8px 16px",
          borderRadius: 8,
          fontSize: "0.8125rem",
          fontWeight: 700,
          textDecoration: "none",
          background: ctaBg,
          color: "white",
          whiteSpace: "nowrap",
        }}
      >
        {!subActive ? "Renew now" : "Upgrade to Pro"}
      </Link>
    </div>
  );
}
