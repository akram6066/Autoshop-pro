import Link from "next/link";

interface Props {
  showDeleted: boolean;
  activeCount: number;
  deletedCount: number;
}

export function ShopTabs({ showDeleted, activeCount, deletedCount }: Props) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
      <Link
        href="/admin/shops?tab=active"
        style={{
          padding: "7px 18px",
          borderRadius: 8,
          fontSize: "0.875rem",
          fontWeight: !showDeleted ? 700 : 500,
          background: !showDeleted ? "#0f172a" : "white",
          color: !showDeleted ? "white" : "#64748b",
          textDecoration: "none",
          border: "1px solid",
          borderColor: !showDeleted ? "#0f172a" : "#e2e8f0",
        }}
      >
        Active
        <span
          style={{
            marginLeft: 8,
            background: !showDeleted ? "rgba(255,255,255,0.18)" : "#e2e8f0",
            color: !showDeleted ? "white" : "#64748b",
            borderRadius: 999,
            padding: "1px 8px",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          {activeCount}
        </span>
      </Link>

      <Link
        href="/admin/shops?tab=deleted"
        style={{
          padding: "7px 18px",
          borderRadius: 8,
          fontSize: "0.875rem",
          fontWeight: showDeleted ? 700 : 500,
          background: showDeleted ? "#dc2626" : "white",
          color: showDeleted
            ? "white"
            : deletedCount > 0
              ? "#dc2626"
              : "#64748b",
          textDecoration: "none",
          border: "1px solid",
          borderColor: showDeleted
            ? "#dc2626"
            : deletedCount > 0
              ? "#fca5a5"
              : "#e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <path
            d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Trash
        {deletedCount > 0 && (
          <span
            style={{
              background: showDeleted ? "rgba(255,255,255,0.22)" : "#fee2e2",
              color: showDeleted ? "white" : "#dc2626",
              borderRadius: 999,
              padding: "1px 8px",
              fontSize: "0.75rem",
            }}
          >
            {deletedCount}
          </span>
        )}
      </Link>
    </div>
  );
}
