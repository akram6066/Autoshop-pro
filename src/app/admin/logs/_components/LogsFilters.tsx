import { CATEGORY_META, LEVEL_META } from "@/lib/admin/classify-error";

export function LogsFilters({
  category,
  level,
  filterHref,
}: {
  category: string;
  level: string;
  filterHref: (overrides: Record<string, string>) => string;
}) {
  const categories = Object.entries(CATEGORY_META);
  const levels = Object.entries(LEVEL_META);

  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Category:
        </span>
        <a
          href={filterHref({ category: "" })}
          style={{
            padding: "5px 12px",
            borderRadius: 999,
            fontSize: "0.8125rem",
            fontWeight: 500,
            textDecoration: "none",
            background: !category ? "#0f172a" : "white",
            color: !category ? "white" : "#475569",
            border: "1px solid #e2e8f0",
          }}
        >
          All
        </a>
        {categories.map(([key, meta]) => (
          <a
            key={key}
            href={filterHref({ category: key })}
            style={{
              padding: "5px 12px",
              borderRadius: 999,
              fontSize: "0.8125rem",
              fontWeight: 500,
              textDecoration: "none",
              background: category === key ? meta.color : meta.bg,
              color: category === key ? "white" : meta.color,
              border: `1px solid ${meta.border}`,
            }}
          >
            {meta.label}
          </a>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Level:
        </span>
        <a
          href={filterHref({ level: "" })}
          style={{
            padding: "5px 12px",
            borderRadius: 999,
            fontSize: "0.8125rem",
            fontWeight: 500,
            textDecoration: "none",
            background: !level ? "#0f172a" : "white",
            color: !level ? "white" : "#475569",
            border: "1px solid #e2e8f0",
          }}
        >
          All
        </a>
        {levels.map(([key, meta]) => (
          <a
            key={key}
            href={filterHref({ level: key })}
            style={{
              padding: "5px 12px",
              borderRadius: 999,
              fontSize: "0.8125rem",
              fontWeight: 500,
              textDecoration: "none",
              background: level === key ? meta.color : meta.bg,
              color: level === key ? "white" : meta.color,
              border: "1px solid transparent",
            }}
          >
            {meta.label}
          </a>
        ))}
      </div>
    </div>
  );
}
