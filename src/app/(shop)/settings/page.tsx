"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectShop, selectShopId } from "@/stores/authStore";
import { seedRooms } from "@/lib/db/instance";
import { useRooms, roomKeys } from "@/hooks/useRooms";
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/useCategories";
import { useTeam, useAddStaff, useRemoveStaff } from "@/hooks/useTeam";
import type { Shop, Room, CategoryItem } from "@/types/app";

const PRESET_COLORS = [
  "#3b6ef5", "#16a34a", "#d97706", "#dc2626",
  "#7c3aed", "#0891b2", "#be185d", "#374151",
];

function randomColor() {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden mb-6 animate-fade-in-up">
      <div className="px-5 py-4" style={{ borderBottom: "1px solid oklch(91% 0.004 250)" }}>
        <h2 className="font-medium">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function RoomRow({ room, onDelete }: { room: Room; onDelete: (id: string) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5"
      style={{ borderBottom: "1px solid oklch(94% 0.003 250)" }}>
      <span className="text-sm">{room.name}</span>
      <button onClick={() => onDelete(room.id)} className="btn btn-ghost btn-sm btn-icon"
        aria-label={`Delete ${room.name}`}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function CategoryRow({ cat, onDelete, onEdit }: {
  cat: CategoryItem;
  onDelete: (id: string) => void;
  onEdit: (cat: CategoryItem) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5"
      style={{ borderBottom: "1px solid oklch(94% 0.003 250)" }}>
      <div className="flex items-center gap-2.5">
        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: cat.color }} />
        <span className="text-sm">{cat.name}</span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onEdit(cat)} className="btn btn-ghost btn-sm btn-icon">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
        <button onClick={() => onDelete(cat.id)} className="btn btn-ghost btn-sm btn-icon"
          style={{ color: "var(--color-danger)" }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const qc = useQueryClient();
  const shop = useAuthStore(selectShop);
  const shopId = useAuthStore(selectShopId);
  const setShop = useAuthStore((s) => s.setShop);
  const [isPending, startTransition] = useTransition();

  // Shop form
  const [shopName, setShopName] = useState(shop?.name ?? "");
  const [shopAddress, setShopAddress] = useState(shop?.address ?? "");
  const [shopMsg, setShopMsg] = useState("");

  // Rooms
  const { data: rooms = [] } = useRooms(shopId);
  const [newRoomName, setNewRoomName] = useState("");
  const [roomMsg, setRoomMsg] = useState("");

  // Categories
  const { data: categories = [] } = useCategories();
  const { mutateAsync: createCategory } = useCreateCategory();
  const { mutateAsync: deleteCategory } = useDeleteCategory();
  const { mutateAsync: updateCategory } = useUpdateCategory();
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(randomColor);
  const [catMsg, setCatMsg] = useState("");
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);

  // Delete account
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");
  const handleDeleteAccount = useCallback(async () => {
    if (!window.confirm(
      "This will permanently delete your account and all your data. This cannot be undone.\n\nType OK to confirm."
    )) return;
    setIsDeletingAccount(true);
    setDeleteMsg("");
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (err: unknown) {
      setDeleteMsg((err as { message?: string })?.message ?? "Failed to delete account");
      setIsDeletingAccount(false);
    }
  }, [supabase]);

  // Team
  const { data: teamMembers = [], isError: teamError } = useTeam(shopId);
  const addStaff = useAddStaff();
  const removeStaff = useRemoveStaff();
  const [staffEmail, setStaffEmail] = useState("");
  const [staffMsg, setStaffMsg] = useState("");
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  async function handleUpdateShop(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId || !shopName.trim()) return;
    setShopMsg("");
    startTransition(async () => {
      const { data, error } = await supabase
        .from("shops").update({ name: shopName.trim(), address: shopAddress.trim() || null })
        .eq("id", shopId).select().single();
      if (error) { setShopMsg(error.message); return; }
      setShop(data as Shop);
      setShopMsg("Saved!");
      setTimeout(() => setShopMsg(""), 2000);
    });
  }

  async function handleAddRoom(e: React.FormEvent) {
    e.preventDefault();
    const name = newRoomName.trim();
    if (!name || !shopId) return;
    setRoomMsg("");
    startTransition(async () => {
      const { data, error } = await supabase
        .from("rooms").insert({ shop_id: shopId, name }).select().single();
      if (error) { setRoomMsg(error.message); return; }
      setNewRoomName("");
      await seedRooms(shopId, [...rooms, data as Room]);
      qc.invalidateQueries({ queryKey: roomKeys.all(shopId) });
    });
  }

  async function handleDeleteRoom(roomId: string) {
    if (!shopId) return;
    const { count } = await supabase.from("products")
      .select("id", { count: "exact", head: true }).eq("room_id", roomId);
    if ((count ?? 0) > 0) {
      setRoomMsg(`Cannot delete — ${count} product(s) in this room. Move them first.`);
      return;
    }
    await supabase.from("rooms").delete().eq("id", roomId);
    const updated = rooms.filter((r) => r.id !== roomId);
    await seedRooms(shopId, updated);
    qc.invalidateQueries({ queryKey: roomKeys.all(shopId) });
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim() || !shopId) return;
    setCatMsg("");
    try {
      if (editingCat) {
        await updateCategory({ categoryId: editingCat.id, name: newCatName, color: newCatColor });
        setEditingCat(null);
      } else {
        await createCategory({ name: newCatName, color: newCatColor });
      }
      setNewCatName("");
      setNewCatColor(randomColor());
    } catch (err: unknown) {
      setCatMsg((err as { message?: string })?.message ?? "Failed to save category");
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    if (!shopId) return;
    const catName = categories.find((c) => c.id === categoryId)?.name ?? "";
    const { count } = await supabase.from("products")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", shopId).eq("category", catName);
    if ((count ?? 0) > 0) {
      setCatMsg(`Cannot delete — ${count} product(s) use this category.`);
      return;
    }
    try {
      await deleteCategory({ categoryId });
    } catch (err: unknown) {
      setCatMsg((err as { message?: string })?.message ?? "Failed to delete category");
    }
  }

  function startEditCategory(cat: CategoryItem) {
    setEditingCat(cat);
    setNewCatName(cat.name);
    setNewCatColor(cat.color);
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!staffEmail.trim() || !shopId) return;
    setStaffMsg("");
    setIsAddingStaff(true);
    try {
      const result = await addStaff(shopId, staffEmail);
      if (result === "user_not_found") {
        setStaffMsg("No account found with that email. Ask them to sign up first at the login page.");
      } else if (result === "already_member") {
        setStaffMsg("That person is already a member of this shop.");
      } else {
        setStaffMsg("Staff member added successfully.");
        setStaffEmail("");
        setTimeout(() => setStaffMsg(""), 3000);
      }
    } catch (err: unknown) {
      setStaffMsg((err as { message?: string })?.message ?? "Failed to add staff");
    } finally {
      setIsAddingStaff(false);
    }
  }

  async function handleRemoveStaff(userId: string) {
    if (!shopId) return;
    setStaffMsg("");
    try {
      await removeStaff(shopId, userId);
    } catch (err: unknown) {
      setStaffMsg((err as { message?: string })?.message ?? "Failed to remove staff");
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl mb-1" style={{ color: "var(--color-ink-primary)" }}>
          Settings
        </h1>
        <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
          Manage your shop, rooms, categories and team
        </p>
      </div>

      {/* Shop details */}
      <Section title="Shop details">
        <form onSubmit={handleUpdateShop} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Shop name</label>
            <input className="input" value={shopName} onChange={(e) => setShopName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Address</label>
            <input className="input" value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)} placeholder="Optional" />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </button>
            {shopMsg && (
              <span className="text-sm"
                style={{ color: shopMsg === "Saved!" ? "var(--color-success)" : "var(--color-danger)" }}>
                {shopMsg}
              </span>
            )}
          </div>
        </form>
      </Section>

      {/* Categories */}
      <Section title="Product categories">
        <p className="text-sm mb-4" style={{ color: "var(--color-ink-tertiary)" }}>
          Categories help organise products. Assign a colour for quick identification.
        </p>

        {categories.length > 0 && (
          <div className="mb-4">
            {categories.map((cat) => (
              <CategoryRow key={cat.id} cat={cat}
                onDelete={handleDeleteCategory}
                onEdit={startEditCategory} />
            ))}
          </div>
        )}

        <form onSubmit={handleAddCategory} className="space-y-3">
          <div className="flex gap-2">
            <input className="input flex-1" type="text"
              placeholder={editingCat ? "Edit category name…" : "New category name…"}
              value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
            <button type="submit" className="btn btn-primary" disabled={!newCatName.trim()}>
              {editingCat ? "Update" : "Add"}
            </button>
            {editingCat && (
              <button type="button" className="btn btn-secondary"
                onClick={() => { setEditingCat(null); setNewCatName(""); setNewCatColor(PRESET_COLORS[0]); }}>
                Cancel
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs" style={{ color: "var(--color-ink-tertiary)" }}>Colour:</span>
            {PRESET_COLORS.map((color) => (
              <button key={color} type="button"
                onClick={() => setNewCatColor(color)}
                className="w-6 h-6 rounded-full transition-transform"
                style={{
                  background: color,
                  transform: newCatColor === color ? "scale(1.25)" : "scale(1)",
                  outline: newCatColor === color ? `2px solid ${color}` : "none",
                  outlineOffset: "2px",
                }} />
            ))}
          </div>
        </form>
        {catMsg && (
          <p className="text-sm mt-2" style={{ color: "var(--color-danger)" }}>{catMsg}</p>
        )}
      </Section>

      {/* Rooms */}
      <Section title="Storage rooms">
        {rooms.length === 0 ? (
          <p className="text-sm mb-4" style={{ color: "var(--color-ink-tertiary)" }}>No rooms yet.</p>
        ) : (
          <div className="mb-4">
            {rooms.map((room) => (
              <RoomRow key={room.id} room={room} onDelete={handleDeleteRoom} />
            ))}
          </div>
        )}
        <form onSubmit={handleAddRoom} className="flex gap-2">
          <input className="input flex-1" type="text" placeholder="New room name…"
            value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
          <button type="submit" className="btn btn-secondary" disabled={!newRoomName.trim()}>
            Add room
          </button>
        </form>
        {roomMsg && (
          <p className="text-sm mt-2" style={{ color: "var(--color-danger)" }}>{roomMsg}</p>
        )}
      </Section>

      {/* Team */}
      {/* Danger zone */}
      <Section title="Danger zone">
        <p className="text-sm mb-4" style={{ color: "var(--color-ink-secondary)" }}>
          Permanently deletes your account, profile, and all associated data. This cannot be undone.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="btn btn-danger"
          disabled={isDeletingAccount}>
          {isDeletingAccount ? "Deleting…" : "Delete Account"}
        </button>
        {deleteMsg && (
          <p className="text-sm mt-3" style={{ color: "var(--color-danger)" }}>{deleteMsg}</p>
        )}
      </Section>

      <Section title="Team">
        {/* Current members */}
        {teamError ? (
          <p className="text-sm mb-4" style={{ color: "var(--color-danger)" }}>
            Could not load team. Run the latest migration and try again.
          </p>
        ) : teamMembers.length === 0 ? (
          <p className="text-sm mb-4" style={{ color: "var(--color-ink-tertiary)" }}>
            No team members yet.
          </p>
        ) : (
          <div className="mb-5">
            {teamMembers.map((member) => (
              <div key={member.user_id} className="flex items-center justify-between py-3"
                style={{ borderBottom: "1px solid oklch(94% 0.003 250)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}>
                    {member.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.full_name || "—"}</p>
                    <span className={`badge ${member.role === "owner" ? "badge-info" : "badge-neutral"} mt-0.5`}>
                      {member.role}
                    </span>
                  </div>
                </div>
                {member.role !== "owner" && (
                  <button onClick={() => handleRemoveStaff(member.user_id)}
                    className="btn btn-ghost btn-sm" style={{ color: "var(--color-danger)" }}>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add staff */}
        <div className="pt-4" style={{ borderTop: teamMembers.length > 0 ? "1px solid oklch(91% 0.004 250)" : "none" }}>
          <p className="text-sm font-medium mb-3">Add staff member</p>
          <form onSubmit={handleAddStaff} className="flex gap-2">
            <input
              className="input flex-1"
              type="email"
              placeholder="staff@email.com"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary"
              disabled={!staffEmail.trim() || isAddingStaff}>
              {isAddingStaff ? "Adding…" : "Add"}
            </button>
          </form>
          {staffMsg && (
            <p className="text-sm mt-2"
              style={{
                color: staffMsg.startsWith("Staff member added")
                  ? "var(--color-success)"
                  : "var(--color-danger)",
              }}>
              {staffMsg}
            </p>
          )}
          <p className="text-xs mt-2" style={{ color: "var(--color-ink-ghost)" }}>
            The person must have already signed up. They will see this shop after being added.
          </p>
        </div>
      </Section>
    </div>
  );
}
