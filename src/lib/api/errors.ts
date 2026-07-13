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
    pattern: /duplicate key|unique.*constraint/i,
    message: "This record already exists",
    status: 409,
  },
  {
    pattern: /foreign key/i,
    message: "Cannot complete this action — related records exist",
    status: 409,
  },
  {
    pattern: /permission denied|not authorized|42501/i,
    message: "You do not have permission to do that",
    status: 403,
  },
  {
    pattern: /limit reached|over limit|maximum.*exceeded/i,
    message: "You have reached the limit for your plan",
    status: 403,
  },
  {
    pattern: /product limit/i,
    message: "Product limit reached. Free plan allows 50 products.",
    status: 403,
  },
  {
    pattern: /room limit/i,
    message: "Room limit reached. Free plan allows 5 rooms.",
    status: 403,
  },
  {
    pattern: /category limit/i,
    message: "Category limit reached. Free plan allows 10 categories.",
    status: 403,
  },
  {
    pattern: /staff limit/i,
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

  return fallback;
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

function extractMessage(err: unknown): string | null {
  if (!err) return null;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null) {
    const e = err as { message?: unknown; error?: unknown };
    if (typeof e.message === "string") return e.message;
    if (typeof e.error === "string") return e.error;
  }
  return null;
}
