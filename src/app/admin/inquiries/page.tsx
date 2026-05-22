/* eslint-disable @typescript-eslint/no-explicit-any */
import { adminDb } from "@/lib/admin/db";
import { updateInquiryStatus } from "./_actions";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const STATUS_LABELS: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  new: { label: "New", color: "#1d4ed8", bg: "#dbeafe" },
  read: { label: "Read", color: "#475569", bg: "#f1f5f9" },
  replied: { label: "Replied", color: "#15803d", bg: "#dcfce7" },
};

export default async function AdminInquiriesPage({ searchParams }: PageProps) {
  const { status = "" } = await searchParams;
  const db = adminDb();

  let query = db
    .from("contact_inquiries")
    .select("id, name, email, subject, message, status, created_at")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data: inquiries } = await query;

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1000 }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: 6,
        }}
      >
        Contact Inquiries
      </h1>
      <p style={{ fontSize: "0.9375rem", color: "#64748b", marginBottom: 24 }}>
        Messages submitted via the contact form.
      </p>

      {/* Status filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { value: "", label: "All" },
          { value: "new", label: "New" },
          { value: "read", label: "Read" },
          { value: "replied", label: "Replied" },
        ].map((f) => (
          <a
            key={f.value}
            href={f.value ? `?status=${f.value}` : "?"}
            style={{
              padding: "6px 16px",
              borderRadius: 999,
              fontSize: "0.8125rem",
              fontWeight: 500,
              textDecoration: "none",
              background: status === f.value ? "#0f172a" : "white",
              color: status === f.value ? "white" : "#475569",
              border: "1px solid #e2e8f0",
            }}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(inquiries ?? []).length === 0 ? (
          <p
            style={{
              padding: "32px 0",
              textAlign: "center",
              fontSize: "0.875rem",
              color: "#94a3b8",
            }}
          >
            No inquiries found.
          </p>
        ) : (
          (inquiries ?? []).map((inq: any) => {
            const s = STATUS_LABELS[inq.status] ?? STATUS_LABELS.new;
            return (
              <div
                key={inq.id}
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "20px 22px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
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
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: 999,
                          background: s.bg,
                          color: s.color,
                        }}
                      >
                        {s.label}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                      {inq.email}
                    </p>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>
                    {new Date(inq.created_at).toLocaleString()}
                  </p>
                </div>
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
                {inq.status !== "replied" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    {inq.status === "new" && (
                      <form
                        action={updateInquiryStatus.bind(null, inq.id, "read")}
                      >
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
                    <form
                      action={updateInquiryStatus.bind(null, inq.id, "replied")}
                    >
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
          })
        )}
      </div>
    </div>
  );
}
