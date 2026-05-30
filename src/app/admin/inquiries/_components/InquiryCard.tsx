import { updateInquiryStatus } from "../_actions";
import { AdminBadge } from "@/app/admin/_components/AdminUI";

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  new: { label: "New", color: "#1d4ed8", bg: "#dbeafe" },
  read: { label: "Read", color: "#475569", bg: "#f1f5f9" },
  replied: { label: "Replied", color: "#15803d", bg: "#dcfce7" },
};

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export function InquiryCard({ inq }: { inq: Inquiry }) {
  const s = STATUS_META[inq.status] ?? STATUS_META.new;

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "20px 22px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}
          >
            <p
              style={{
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: "#0f172a",
              }}
            >
              {inq.name}
            </p>
            <AdminBadge label={s.label} bg={s.bg} color={s.color} />
          </div>
          <p style={{ fontSize: "0.8125rem", color: "#64748b" }}>{inq.email}</p>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>
          {new Date(inq.created_at).toLocaleString()}
        </p>
      </div>

      {/* Subject + body */}
      <p
        style={{
          fontWeight: 600,
          fontSize: "0.875rem",
          color: "#334155",
          marginBottom: 8,
        }}
      >
        {inq.subject}
      </p>
      <p
        style={{
          fontSize: "0.875rem",
          color: "#475569",
          lineHeight: 1.7,
          marginBottom: 16,
        }}
      >
        {inq.message}
      </p>

      {/* Actions */}
      {inq.status !== "replied" && (
        <div style={{ display: "flex", gap: 8 }}>
          {inq.status === "new" && (
            <form action={updateInquiryStatus.bind(null, inq.id, "read")}>
              <button
                type="submit"
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                }}
              >
                Mark read
              </button>
            </form>
          )}
          <form action={updateInquiryStatus.bind(null, inq.id, "replied")}>
            <button
              type="submit"
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: "0.8125rem",
                fontWeight: 600,
                background: "#dcfce7",
                color: "#15803d",
                border: "1px solid #86efac",
                cursor: "pointer",
              }}
            >
              Mark replied
            </button>
          </form>
          <a
            href={`mailto:${inq.email}?subject=Re: ${encodeURIComponent(inq.subject)}`}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: "0.8125rem",
              fontWeight: 600,
              background: "#dbeafe",
              color: "#1d4ed8",
              border: "1px solid #93c5fd",
              textDecoration: "none",
            }}
          >
            Reply by email
          </a>
        </div>
      )}
    </div>
  );
}
