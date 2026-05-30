export function UserSearchForm({ q }: { q: string }) {
  return (
    <form method="GET" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 10, maxWidth: 400 }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          style={{
            flex: 1,
            padding: "9px 14px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: "0.875rem",
            background: "white",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            background: "#0f172a",
            color: "white",
            fontSize: "0.875rem",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Search
        </button>
        {q && (
          <a
            href="/admin/users"
            style={{
              padding: "9px 14px",
              borderRadius: 8,
              background: "#f1f5f9",
              color: "#475569",
              fontSize: "0.875rem",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            Clear
          </a>
        )}
      </div>
    </form>
  );
}
