import { adminDb } from "@/lib/admin/db";
import { AdminPageHeader } from "@/app/admin/_components/AdminUI";
import { InquiryStatusFilter } from "./_components/InquiryStatusFilter";
import { InquiryCard, type Inquiry } from "./_components/InquiryCard";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

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
      <AdminPageHeader
        title="Contact Inquiries"
        description="Messages submitted via the contact form."
      />
      <InquiryStatusFilter current={status} />

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
          (inquiries as Inquiry[]).map((inq) => (
            <InquiryCard key={inq.id} inq={inq} />
          ))
        )}
      </div>
    </div>
  );
}
