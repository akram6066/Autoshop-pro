import Link from "next/link";

// ── AdminCard ────────────────────────────────────────────────────────────────
export function AdminCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── AdminPageHeader ──────────────────────────────────────────────────────────
export function AdminPageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: 6,
        }}
      >
        {title}
      </h1>
      <p style={{ fontSize: "0.9375rem", color: "#64748b", marginBottom: 28 }}>
        {description}
      </p>
    </>
  );
}

// ── AdminBadge ───────────────────────────────────────────────────────────────
export function AdminBadge({
  label,
  bg,
  color,
}: {
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <span
      style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 999,
        background: bg,
        color,
      }}
    >
      {label}
    </span>
  );
}

// ── AdminTable ───────────────────────────────────────────────────────────────
export function AdminTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ background: "#f8fafc" }}>
          {headers.map((h) => (
            <th
              key={h}
              style={{
                padding: "11px 16px",
                textAlign: "left",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#64748b",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

// ── AdminTD ──────────────────────────────────────────────────────────────────
export function AdminTD({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return <td style={{ padding: "13px 16px", ...style }}>{children}</td>;
}

// ── AdminEmptyRow ────────────────────────────────────────────────────────────
export function AdminEmptyRow({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          padding: "48px 16px",
          textAlign: "center",
          fontSize: "0.875rem",
          color: "#94a3b8",
        }}
      >
        {message}
      </td>
    </tr>
  );
}

// ── AdminPagination ──────────────────────────────────────────────────────────
export function AdminPagination({
  current,
  total,
  hrefFn,
}: {
  current: number;
  total: number;
  hrefFn: (p: number) => string;
}) {
  if (total <= 1) return null;
  const pages = Array.from({ length: Math.min(total, 10) }, (_, i) => i + 1);
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginTop: 20,
        justifyContent: "flex-end",
      }}
    >
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFn(p)}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            fontSize: "0.875rem",
            fontWeight: p === current ? 700 : 400,
            background: p === current ? "#0f172a" : "white",
            color: p === current ? "white" : "#475569",
            border: "1px solid #e2e8f0",
            textDecoration: "none",
          }}
        >
          {p}
        </Link>
      ))}
    </div>
  );
}

// ── AdminInitial ─────────────────────────────────────────────────────────────
// Coloured avatar initial chip used in rows
export function AdminInitial({
  name,
  bg,
  color,
  round,
}: {
  name: string;
  bg: string;
  color: string;
  round?: boolean;
}) {
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: round ? "50%" : 8,
        background: bg,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.8125rem",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {(name ?? "?")[0].toUpperCase()}
    </div>
  );
}
