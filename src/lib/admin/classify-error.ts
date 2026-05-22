export type ErrorCategory =
  | "api"
  | "database"
  | "frontend"
  | "shop_management"
  | "user_management"
  | "other";

export function classifyError(error: unknown, path?: string): ErrorCategory {
  const msg = (
    error instanceof Error ? error.message : String(error)
  ).toLowerCase();
  const stack = (
    error instanceof Error ? (error.stack ?? "") : ""
  ).toLowerCase();

  if (
    msg.includes("postgres") ||
    msg.includes("supabase") ||
    msg.includes("dexie") ||
    msg.includes("indexeddb") ||
    msg.includes("duplicate key") ||
    msg.includes("foreign key") ||
    msg.includes("violates") ||
    msg.includes("row level security") ||
    msg.includes("relation") ||
    msg.includes("deadlock") ||
    msg.includes("connection refused")
  )
    return "database";

  if (
    path?.startsWith("/api") ||
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("timeout") ||
    msg.includes("bad request") ||
    msg.includes("status 4") ||
    msg.includes("status 5") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound")
  )
    return "api";

  if (
    msg.includes("auth") ||
    msg.includes("unauthorized") ||
    msg.includes("unauthenticated") ||
    msg.includes("session") ||
    msg.includes("jwt") ||
    msg.includes("token") ||
    msg.includes("password") ||
    msg.includes("email not confirmed") ||
    path?.includes("/login") ||
    path?.includes("/signup") ||
    path?.includes("/profile") ||
    path?.includes("/setup")
  )
    return "user_management";

  if (
    msg.includes("shop") ||
    msg.includes("inventory") ||
    msg.includes("product") ||
    msg.includes("sale") ||
    msg.includes("stock") ||
    msg.includes("sync") ||
    msg.includes("record_sale") ||
    path?.includes("/inventory") ||
    path?.includes("/pos") ||
    path?.includes("/sales") ||
    path?.includes("/reports") ||
    path?.includes("/finder")
  )
    return "shop_management";

  if (
    stack.includes("react-dom") ||
    msg.includes("hydrat") ||
    msg.includes("minified react error") ||
    msg.includes("cannot read propert") ||
    msg.includes("is not a function") ||
    msg.includes("undefined is not") ||
    msg.includes("null is not") ||
    msg.includes("render")
  )
    return "frontend";

  return "other";
}

export const CATEGORY_META: Record<
  ErrorCategory,
  { label: string; color: string; bg: string; border: string }
> = {
  api: {
    label: "API",
    color: "#1d4ed8",
    bg: "#dbeafe",
    border: "#93c5fd",
  },
  database: {
    label: "Database",
    color: "#6d28d9",
    bg: "#ede9fe",
    border: "#c4b5fd",
  },
  frontend: {
    label: "Frontend",
    color: "#c2410c",
    bg: "#ffedd5",
    border: "#fdba74",
  },
  shop_management: {
    label: "Shop",
    color: "#15803d",
    bg: "#dcfce7",
    border: "#86efac",
  },
  user_management: {
    label: "User",
    color: "#a16207",
    bg: "#fef9c3",
    border: "#fde047",
  },
  other: {
    label: "Other",
    color: "#475569",
    bg: "#f1f5f9",
    border: "#cbd5e1",
  },
};

export const LEVEL_META: Record<
  "error" | "warning" | "info",
  { label: string; color: string; bg: string }
> = {
  error: { label: "Error", color: "#dc2626", bg: "#fee2e2" },
  warning: { label: "Warning", color: "#d97706", bg: "#fef3c7" },
  info: { label: "Info", color: "#0369a1", bg: "#e0f2fe" },
};
