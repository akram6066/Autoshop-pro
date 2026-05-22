import type { CategoryItem } from "@/types/app";

export const PRESET_COLORS = [
  "#3b6ef5",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#be185d",
  "#374151",
];

interface Props {
  categories: CategoryItem[];
  catName: string;
  catColor: string;
  error: string;
  catAdding: boolean;
  isPending: boolean;
  mounted: boolean;
  onCatNameChange: (v: string) => void;
  onCatColorChange: (c: string) => void;
  onAddCategory: (e: React.FormEvent) => void;
  onDeleteCategory: (id: string) => void;
  onFinish: () => void;
}

export default function SetupCategoriesStep({
  categories,
  catName,
  catColor,
  error,
  catAdding,
  isPending,
  mounted,
  onCatNameChange,
  onCatColorChange,
  onAddCategory,
  onDeleteCategory,
  onFinish,
}: Props) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-medium mb-1">Product categories</h2>
      <p
        className="text-sm mb-5"
        style={{ color: "var(--color-ink-secondary)" }}
      >
        We&apos;ve added some defaults for your shop. Remove any you don&apos;t
        need, or add your own.
      </p>

      {/* Category list */}
      {categories.length > 0 && (
        <div className="mb-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between py-2.5"
              style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ background: cat.color }}
                />
                <span className="text-sm">{cat.name}</span>
              </div>
              <button
                type="button"
                onClick={() => onDeleteCategory(cat.id)}
                className="btn btn-ghost btn-sm btn-icon"
                style={{ color: "var(--color-danger)" }}
                aria-label={`Remove ${cat.name}`}
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new category */}
      <form onSubmit={onAddCategory} className="space-y-3 mb-5">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            type="text"
            placeholder="New category name…"
            value={catName}
            onChange={(e) => onCatNameChange(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={!catName.trim() || catAdding}
          >
            {catAdding ? "Adding…" : "Add"}
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            Colour:
          </span>
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onCatColorChange(c)}
              className="w-6 h-6 rounded-full transition-transform"
              style={{
                background: c,
                transform: catColor === c ? "scale(1.25)" : "scale(1)",
                outline: catColor === c ? `2px solid ${c}` : "none",
                outlineOffset: "2px",
              }}
              aria-label={c}
            />
          ))}
        </div>
      </form>

      {error && (
        <p className="mb-4 text-sm" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onFinish}
        className="btn btn-primary w-full"
        disabled={!mounted || isPending}
      >
        {isPending ? "Finishing…" : "Finish setup →"}
      </button>
      <button
        type="button"
        onClick={onFinish}
        className="w-full mt-3 text-sm text-center"
        style={{ color: "var(--color-ink-tertiary)" }}
        disabled={isPending}
      >
        Skip, I&apos;ll set up categories later
      </button>
    </div>
  );
}
