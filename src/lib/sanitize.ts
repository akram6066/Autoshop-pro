// Strips null bytes, C0 control chars (except tab/LF/CR), DEL, and C1 control chars.
// Preserves normal text, emoji, and Unicode.
const CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g;

export function sanitizeText(input: string): string {
  return input.replace(CONTROL_CHAR_RE, "").trim();
}

/**
 * RFC 4180-compliant CSV field escaping.
 * - Wraps fields containing commas, quotes, or newlines in double-quotes
 * - Escapes double-quotes by doubling them
 * - Prefixes formula-injection chars (=, +, -, @, tab, pipe) with a space
 *   to prevent spreadsheet formula execution
 */
export function escapeCsvField(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/^[=+\-@\t|]/.test(str)) {
    const escaped = str.replace(/"/g, '""');
    return `" ${escaped}"`;
  }
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
