/**
 * Sanitize errors before returning them to the client.
 *
 * Raw Supabase / Postgres error messages can leak schema info, table names,
 * column names, RLS policy names, and SQL fragments. We map known cases to
 * user-friendly messages and return a generic message for everything else.
 *
 * The original error is always logged server-side via the `log` callback so
 * we don't lose debuggability.
 */

interface SanitizeOptions {
  log?: (err: unknown) => void;
  fallback?: string;
}

const KNOWN_PATTERNS: Array<{
  pattern: RegExp;
  message: string;
  status: number;
}> = [
  {
    pattern: /already (been )?registered|already exists/i,
    message: "An account with this email already exists",
    status: 409,
  },
  {
    pattern: /invalid.*credentials|invalid.*password/i,
    message: "Invalid email or password",
    status: 401,
  },
  {
    pattern: /email.*not.*confirmed/i,
    message: "Please confirm your email before signing in",
    status: 401,
  },
  {
    pattern: /rate limit|too many requests/i,
    message: "Too many attempts. Please wait a few minutes.",
    status: 429,
  },
  {
    pattern: /jwt.*expired|invalid.*jwt/i,
    message: "Your session has expired. Please sign in again.",
    status: 401,
  },
  {
    pattern: /insufficient stock/i,
    message: "Not enough stock for this sale",
    status: 409,
  },
  {
    pattern: /duplicate key|unique.*constraint|23505/i,
    message:
      "A product or record with this SKU or Name already exists in your inventory.",
    status: 409,
  },
  {
    pattern: /products_room_id_fkey/i,
    message: "The selected storage location is invalid or does not exist.",
    status: 400,
  },
  {
    pattern: /violates foreign key constraint|foreign key/i,
    message:
      "Cannot remove this item because it is referenced in past sales or activity history.",
    status: 409,
  },
  {
    pattern: /check constraint|chk_|value out of range/i,
    message:
      "Please verify your numbers. Prices and quantities must be positive whole amounts.",
    status: 400,
  },
  {
    pattern: /null value in column|violates not-null/i,
    message: "Please fill in all required fields before saving.",
    status: 400,
  },
  {
    pattern: /failed to fetch|networkerror|load failed|network request failed/i,
    message:
      "Connection problem. Changes are queued offline and will sync when online.",
    status: 503,
  },
  {
    pattern: /permission denied|not authorized|42501|unauthenticated/i,
    message: "You need owner or manager permissions to do this.",
    status: 403,
  },
  {
    pattern: /limit reached|over limit|maximum.*exceeded/i,
    message: "You have reached the limit for your plan",
    status: 403,
  },
  {
    pattern: /product[ _-]limit/i,
    message: "Product limit reached. Free plan allows 50 products.",
    status: 403,
  },
  {
    pattern: /room[ _-]limit/i,
    message: "Room limit reached. Free plan allows 5 rooms.",
    status: 403,
  },
  {
    pattern: /category[ _-]limit/i,
    message: "Category limit reached. Free plan allows 10 categories.",
    status: 403,
  },
  {
    pattern: /staff[ _-]limit/i,
    message: "Staff limit reached. Free plan allows 3 staff members.",
    status: 403,
  },
];

/**
 * Client-safe: translate a raw Supabase/Postgres error into a plain-English
 * message the user can act on. Never leaks constraint names or SQL fragments.
 */
export function friendlyError(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const raw = extractMessage(err);
  if (!raw) return fallback;

  // Unique constraint violations — check constraint/table name for specificity
  if (/duplicate key|unique.*constraint|23505/i.test(raw)) {
    if (/categories_/i.test(raw))
      return "A category with that name already exists.";
    if (/products_/i.test(raw))
      return "A product with this SKU or Name already exists.";
    if (/shops_/i.test(raw)) return "A shop with that name already exists.";
    if (/profiles_/i.test(raw))
      return "An account with this email already exists.";
    return "This already exists. Please use a different name or SKU.";
  }

  // Walk the rest of the known patterns
  for (const { pattern, message } of KNOWN_PATTERNS) {
    if (pattern.test(raw)) return message;
  }

  // Prevent leaking raw database schemas, table names or SQL fragments
  if (
    /relation\s+"?\w+"?|column\s+"?\w+"?|syntax error|syntax near|pg_|pgrst|violates|constraint|sqlstate/i.test(
      raw,
    )
  ) {
    return fallback;
  }

  return raw.length > 150 ? fallback : raw;
}

export function sanitizeError(
  err: unknown,
  opts: SanitizeOptions = {},
): { message: string; status: number } {
  const fallback = opts.fallback ?? "Something went wrong. Please try again.";

  // Always log the real error server-side
  if (opts.log) {
    opts.log(err);
  } else {
    console.error("[api] error:", err);
  }

  const raw = extractMessage(err);
  if (!raw) return { message: fallback, status: 500 };

  for (const { pattern, message, status } of KNOWN_PATTERNS) {
    if (pattern.test(raw)) return { message, status };
  }

  return { message: fallback, status: 500 };
}

export function extractMessage(err: unknown): string | null {
  if (!err) return null;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null) {
    const e = err as { message?: unknown; error?: unknown; details?: unknown };
    if (typeof e.message === "string" && e.message.trim()) return e.message;
    if (typeof e.error === "string" && e.error.trim()) return e.error;
    if (typeof e.details === "string" && e.details.trim()) return e.details;
  }
  return null;
}

export function normalizeError(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): Error {
  if (err instanceof Error) return err;
  const msg = extractMessage(err);
  const error = new Error(msg || fallback);
  if (typeof err === "object" && err !== null) {
    Object.assign(error, err);
  }
  return error;
}
