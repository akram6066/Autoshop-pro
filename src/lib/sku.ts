export function generateSku(productName: string, size: string): string {
  const initials = productName
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
  const cleanSize = size.trim().replace(/\s+/g, "").toUpperCase();
  return `${initials}-${cleanSize}`;
}
