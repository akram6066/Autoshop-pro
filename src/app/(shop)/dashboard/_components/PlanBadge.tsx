import type { SubscriptionInfo } from "@/lib/subscription";

const PLAN_STYLE: Record<
  string,
  { label: string; bg: string; color: string; border: string }
> = {
  trial: {
    label: "Free",
    bg: "var(--color-badge-neutral-bg)",
    color: "var(--color-badge-neutral-text)",
    border: "var(--color-badge-neutral-border)",
  },
  pro: {
    label: "Pro",
    bg: "var(--color-badge-blue-bg)",
    color: "var(--color-badge-blue-text)",
    border: "var(--color-badge-blue-border)",
  },
  ultra_pro: {
    label: "Ultra Pro",
    bg: "var(--color-badge-purple-bg)",
    color: "var(--color-badge-purple-text)",
    border: "var(--color-badge-purple-border)",
  },
  free_forever: {
    label: "Free",
    bg: "var(--color-success-light)",
    color: "var(--color-success-text)",
    border: "var(--color-success)",
  },
};

interface Props {
  sub: SubscriptionInfo;
}

export function PlanBadge({ sub }: Props) {
  const planName = sub.plan.name;
  const style = PLAN_STYLE[planName] ?? PLAN_STYLE.trial;

  const isTrialing = sub.status === "trial" && !sub.is_admin_override;
  const isFreeForever = sub.is_admin_override || planName === "free_forever";

  const now = new Date();
  const daysLeft =
    isTrialing && sub.trial_ends_at && planName !== "trial"
      ? Math.max(
          0,
          Math.ceil(
            (new Date(sub.trial_ends_at).getTime() - now.getTime()) /
              86_400_000,
          ),
        )
      : null;

  const label = isFreeForever
    ? "Free (Admin)"
    : isTrialing && planName !== "trial"
      ? `${style.label} · Trial${daysLeft !== null ? ` · ${daysLeft}d left` : ""}`
      : style.label;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: "0.75rem",
        fontWeight: 700,
        background: style.bg,
        color: style.color,
        border: `1.5px solid ${style.border}`,
        letterSpacing: "0.01em",
      }}
    >
      {isTrialing && planName !== "trial" && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: style.color,
            opacity: 0.7,
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </span>
  );
}
