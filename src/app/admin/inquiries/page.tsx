import { adminDb } from "@/lib/admin/db";
import {
  AdminPageHeader,
  AdminPageWrapper,
  AdminPagination,
} from "@/app/admin/_components/AdminUI";
import { InquiryStatusFilter } from "./_components/InquiryStatusFilter";
import { InquiryCard, type Inquiry } from "./_components/InquiryCard";

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

const PAGE_SIZE = 20;

export default async function AdminInquiriesPage({ searchParams }: PageProps) {
  const { status = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page));
  const from = (pageNum - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const db = adminDb();

  let countQuery = db
    .from("contact_inquiries")
    .select("id", { count: "exact", head: true });
  if (status) countQuery = countQuery.eq("status", status);
  const { count } = await countQuery;

  let query = db
    .from("contact_inquiries")
    .select("id, name, email, subject, message, status, created_at")
    .order("created_at", { ascending: false })
    .range(from, to);
  if (status) query = query.eq("status", status);

  const { data: inquiries } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <AdminPageWrapper maxWidth={1000}>
      <AdminPageHeader
        title="Contact Inquiries"
        description={`${count ?? 0} message${count !== 1 ? "s" : ""} submitted via the contact form.`}
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

      <AdminPagination
        current={pageNum}
        total={totalPages}
        hrefFn={(p) =>
          `?${status ? `status=${encodeURIComponent(status)}&` : ""}page=${p}`
        }
      />
    </AdminPageWrapper>
  );
}
