"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/useCategories";
import type { CategoryItem } from "@/types/app";

const PRESET_COLORS = ["#3b6ef5","#16a34a","#d97706","#dc2626","#7c3aed","#0891b2","#be185d","#374151"];
const randomColor = () => PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];

export function CategoriesSection() {
  const supabase = createClient();
  const shopId = useAuthStore(selectShopId);
  const { data: categories = [] } = useCategories();
  const { mutateAsync: createCategory } = useCreateCategory(shopId ?? "");
  const { mutateAsync: deleteCategory } = useDeleteCategory();
  const { mutateAsync: updateCategory } = useUpdateCategory();
  const [name, setName] = useState("");
  const [color, setColor] = useState(randomColor);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<CategoryItem | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !shopId) return;
    setMsg("");
    try {
      if (editing) {
        await updateCategory({ categoryId: editing.id, name, color });
        setEditing(null);
      } else {
        await createCategory({ name, color });
      }
      setName(""); setColor(randomColor());
    } catch (err: unknown) {
      setMsg((err as { message?: string })?.message ?? "Failed to save category");
    }
  }

  async function handleDelete(categoryId: string) {
    if (!shopId) return;
    const catName = categories.find((c) => c.id === categoryId)?.name ?? "";
    const { count } = await supabase.from("products")
      .select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("category", catName);
    if ((count ?? 0) > 0) { setMsg(`Cannot delete — ${count} product(s) use this category.`); return; }
    try {
      await deleteCategory({ categoryId });
    } catch (err: unknown) {
      setMsg((err as { message?: string })?.message ?? "Failed to delete category");
    }
  }

  return (
    <>
      <p className="text-sm mb-4" style={{ color: "var(--color-ink-tertiary)" }}>
        Categories help organise products. Assign a colour for quick identification.
      </p>
      {categories.length > 0 && (
        <div className="mb-4">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-2.5"
              style={{ borderBottom: "1px solid oklch(94% 0.003 250)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                <span className="text-sm">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditing(cat); setName(cat.name); setColor(cat.color); }}
                  className="btn btn-ghost btn-sm btn-icon">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </button>
                <button onClick={() => handleDelete(cat.id)} className="btn btn-ghost btn-sm btn-icon"
                  style={{ color: "var(--color-danger)" }}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input className="input flex-1" type="text"
            placeholder={editing ? "Edit category name…" : "New category name…"}
            value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            {editing ? "Update" : "Add"}
          </button>
          {editing && (
            <button type="button" className="btn btn-secondary"
              onClick={() => { setEditing(null); setName(""); setColor(PRESET_COLORS[0]); }}>
              Cancel
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs" style={{ color: "var(--color-ink-tertiary)" }}>Colour:</span>
          {PRESET_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full transition-transform"
              style={{
                background: c,
                transform: color === c ? "scale(1.25)" : "scale(1)",
                outline: color === c ? `2px solid ${c}` : "none",
                outlineOffset: "2px",
              }} />
          ))}
        </div>
      </form>
      {msg && <p className="text-sm mt-2" style={{ color: "var(--color-danger)" }}>{msg}</p>}
    </>
  );
}