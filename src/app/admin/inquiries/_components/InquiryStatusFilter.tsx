const FILTERS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
];

export function InquiryStatusFilter({ current }: { current: string }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
      {FILTERS.map((f) => (
        <a
          key={f.value}
          href={f.value ? `?status=${f.value}` : "?"}
          style={{
            padding: "6px 16px",
            borderRadius: 999,
            fontSize: "0.8125rem",
            fontWeight: 500,
            textDecoration: "none",
            background: current === f.value ? "#0f172a" : "white",
            color: current === f.value ? "white" : "#475569",
            border: "1px solid #e2e8f0",
          }}
        >
          {f.label}
        </a>
      ))}
    </div>
  );
}
