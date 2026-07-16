import type { SubInfo } from "@/app/(shop)/settings/_components/sub-types";

const PLAN_STYLE: Record<
  string,
  { label: string; bg: string; color: string; border: string }
> = {
  trial: {
    label: "Free",
    bg: "rgba(255, 255, 255, 0.05)",
    color: "#a1a1aa", // zinc-400
    border: "rgba(255, 255, 255, 0.1)",
  },
  pro: {
    label: "Pro",
    bg: "rgba(99, 102, 241, 0.15)", // brand-500/15
    color: "#818cf8", // brand-400
    border: "rgba(99, 102, 241, 0.3)",
  },
  ultra_pro: {
    label: "Big Companies",
    bg: "rgba(168, 85, 247, 0.15)", // purple-500/15
    color: "#c084fc", // purple-400
    border: "rgba(168, 85, 247, 0.3)",
  },
  free_forever: {
    label: "Free",
    bg: "rgba(34, 197, 94, 0.15)", // success/15
    color: "#4ade80", // success-400
    border: "rgba(34, 197, 94, 0.3)",
  },
};

interface Props {
  sub: SubInfo;
}

export function PlanBadge({ sub }: Props) {
  const planName = sub.plan.name;
  const style = PLAN_STYLE[planName] ?? PLAN_STYLE.trial;

  const isTrialing = sub.status === "trial" && !sub.isAdminOverride;
  const isFreeForever = sub.isAdminOverride || planName === "free_forever";

  const now = new Date();
  const daysLeft =
    isTrialing && sub.trialEndsAt && planName !== "trial"
      ? Math.max(
          0,
          Math.ceil(
            (new Date(sub.trialEndsAt).getTime() - now.getTime()) / 86_400_000,
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
