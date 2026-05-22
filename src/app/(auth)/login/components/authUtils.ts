export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const code = (
    err instanceof Error && "code" in err
      ? String((err as NodeJS.ErrnoException).code)
      : ""
  ).toLowerCase();
  return (
    msg.includes("fetch failed") ||
    msg.includes("connect timeout") ||
    msg.includes("connecttimeout") ||
    msg.includes("und_err") ||
    msg.includes("enotfound") ||
    msg.includes("econnrefused") ||
    msg.includes("econnreset") ||
    msg.includes("aborted") ||
    msg.includes("network") ||
    msg.includes("offline") ||
    msg.includes("slow or unstable") ||
    msg.includes("appear to be offline") ||
    code === "econnreset" ||
    code === "econnrefused" ||
    code === "enotfound" ||
    code === "econnaborted"
  );
}

export function friendlyAuthError(message: string): string {
  if (typeof navigator !== "undefined" && !navigator.onLine)
    return "You're offline. Please check your internet connection and try again.";

  const m = message.toLowerCase();

  // Network / connectivity errors — check these before auth errors
  if (m.includes("offline") || m.includes("appear to be offline"))
    return "You're offline. Please check your internet connection and try again.";
  if (
    m.includes("fetch failed") ||
    m.includes("connecttimeout") ||
    m.includes("connect timeout") ||
    m.includes("und_err") ||
    m.includes("econnreset") ||
    m.includes("aborted")
  )
    return "The connection was interrupted. Your internet may be unstable — please try again.";
  if (
    m.includes("slow or unstable") ||
    m.includes("timed out") ||
    m.includes("timeout")
  )
    return "Your internet is too slow or unstable. Please check your connection and try again.";
  if (
    m.includes("network") ||
    m.includes("fetch") ||
    m.includes("enotfound") ||
    m.includes("econnrefused")
  )
    return "Connection failed. Check your internet and try again.";

  // Auth-specific errors
  if (m.includes("supabase") && m.includes("missing"))
    return "Auth is not configured on this deployment. Check the Vercel Supabase environment variables.";
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "Incorrect email or password. Please try again.";
  if (m.includes("email not confirmed"))
    return "Please confirm your email address before signing in.";
  if (m.includes("too many") || m.includes("rate limit"))
    return "Too many attempts — wait a few minutes and try again.";

  return message;
}
