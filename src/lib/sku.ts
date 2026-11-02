export interface GenerateSkuOptions {
  category?: string | null;
  existingSkus?: Iterable<string> | null;
  includeCategory?: boolean;
}

/**
 * Generates a clean, unique, and human-readable SKU.
 *
 * Examples:
 *  - Single word ("Amaron", "12V") -> "AMA-12V"
 *  - Single word ("Automate", "12V") -> "AUT-12V" (avoids 1-letter collision)
 *  - Two words ("Amaron Pro", "12V") -> "AMA-PRO-12V"
 *  - Three+ words ("Michelin Pilot Sport", "1") -> "MPS-1"
 *  - Same 3 letters collision ("Amazon", "12V" with existing "AMA-12V") -> "AMA-12V-02"
 *  - With Category option ("Amaron", "12V", { category: "Battery", includeCategory: true }) -> "BAT-AMA-12V"
 */
export function generateSku(
  productName: string,
  size?: string | null,
  options?: GenerateSkuOptions,
): string {
  const cleanName = (productName ?? "").trim();
  if (!cleanName) return "";

  // Split into clean alphanumeric words
  const words = cleanName
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean);

  let prefix = "";
  if (words.length === 0) {
    prefix = cleanName
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 3)
      .toUpperCase();
  } else if (words.length === 1) {
    // Single word: take up to first 3 characters (e.g., "Amaron" -> "AMA", "Automate" -> "AUT")
    prefix = words[0].slice(0, 3).toUpperCase();
  } else if (words.length === 2) {
    // Two words: take first 3 chars of first word + first 3 chars of second word (e.g. "Amaron Pro" -> "AMA-PRO")
    const w1 = words[0].slice(0, 3).toUpperCase();
    const w2 = words[1].slice(0, 3).toUpperCase();
    prefix = `${w1}-${w2}`;
  } else {
    // 3 or more words: take initials of each word (e.g., "Michelin Pilot Sport" -> "MPS")
    prefix = words
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase();
  }

  // If includeCategory is enabled and category is provided, prefix with category abbreviation
  if (options?.includeCategory && options?.category?.trim()) {
    const catCode = options.category
      .trim()
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 3)
      .toUpperCase();
    if (catCode && !prefix.startsWith(catCode)) {
      prefix = `${catCode}-${prefix}`;
    }
  }

  // Clean size: remove whitespace
  const cleanSize = (size ?? "").trim().replace(/\s+/g, "").toUpperCase();
  const baseSku = cleanSize ? `${prefix}-${cleanSize}` : prefix;

  // Collision resolution against existing SKUs
  if (!options?.existingSkus) {
    return baseSku;
  }

  const existingSet =
    options.existingSkus instanceof Set
      ? options.existingSkus
      : new Set(
          Array.from(options.existingSkus).map((s) =>
            (s ?? "").trim().toLowerCase(),
          ),
        );

  // If the base SKU is not taken, use it
  if (!existingSet.has(baseSku.toLowerCase())) {
    return baseSku;
  }

  // Otherwise, append sequential suffix: -02, -03, etc.
  let counter = 2;
  let candidate = `${baseSku}-${String(counter).padStart(2, "0")}`;
  while (existingSet.has(candidate.toLowerCase())) {
    counter++;
    candidate = `${baseSku}-${String(counter).padStart(2, "0")}`;
  }

  return candidate;
}
