import Link from "next/link";

export interface LimitItem {
  label: string;
  current: number;
  max: number;
}

function severity(item: LimitItem): "full" | "warn" | "ok" {
  if (item.max >= 999999) return "ok";
  if (item.current >= item.max) return "full";
  if (item.current / item.max >= 0.8) return "warn";
  return "ok";
}

interface Props {
  items: LimitItem[];
  upgradeHref?: string;
}

export function LimitWarningBanner({ items, upgradeHref = "/billing" }: Props) {
  const fulls = items.filter((i) => severity(i) === "full");
  const warns = items.filter((i) => severity(i) === "warn");

  if (fulls.length === 0 && warns.length === 0) return null;

  const isBlocking = fulls.length > 0;
  const affected = isBlocking ? fulls : warns;
  const labels = affected.map((i) => i.label).join(" and ");

  const bg = isBlocking
    ? "var(--color-danger-light)"
    : "var(--color-warning-bg)";
  const border = isBlocking
    ? "var(--color-danger)"
    : "var(--color-warning-border)";
  const color = isBlocking
    ? "var(--color-danger-text)"
    : "var(--color-warning-text-strong)";
  const iconColor = isBlocking ? "var(--color-danger)" : "var(--color-warning)";
  const ctaBg = isBlocking ? "var(--color-danger)" : "var(--color-warning)";

  const headline = isBlocking
    ? `${labels.charAt(0).toUpperCase() + labels.slice(1)} limit reached`
    : `Running low on ${labels}`;

  const detail = isBlocking
    ? `You've hit the limit on ${labels}. Upgrade your plan to continue.`
    : `You've used ${affected.map((i) => `${i.current} of ${i.max} ${i.label}`).join(", ")}. Consider upgrading before you run out.`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 10,
        marginBottom: 20,
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      <svg
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 24 24"
        style={{ color: iconColor, flexShrink: 0, marginTop: 2 }}
      >
        <path
          d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color,
            marginBottom: 1,
          }}
        >
          {headline}
        </p>
        <p style={{ fontSize: "0.8125rem", color }}>{detail}</p>
      </div>

      <Link
        href={upgradeHref}
        style={{
          flexShrink: 0,
          padding: "6px 14px",
          borderRadius: 7,
          fontSize: "0.8125rem",
          fontWeight: 700,
          textDecoration: "none",
          background: ctaBg,
          color: "white",
          whiteSpace: "nowrap",
        }}
      >
        Upgrade
      </Link>
    </div>
  );
}

export function usagePct(current: number, max: number): number {
  if (max >= 999999) return 0;
  return Math.min(100, Math.round((current / max) * 100));
}
