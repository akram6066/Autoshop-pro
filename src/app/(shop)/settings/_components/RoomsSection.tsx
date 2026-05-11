"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { seedRooms } from "@/lib/db/instance";
import { useRooms, roomKeys } from "@/hooks/useRooms";
import type { Room } from "@/types/app";

export function RoomsSection() {
  const supabase = createClient();
  const qc = useQueryClient();
  const shopId = useAuthStore(selectShopId);
  const { data: rooms = [] } = useRooms(shopId);
  const [newRoomName, setNewRoomName] = useState("");
  const [msg, setMsg] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newRoomName.trim();
    if (!name || !shopId) return;
    setMsg("");
    const { data, error } = await supabase
      .from("rooms")
      .insert({ shop_id: shopId, name })
      .select()
      .single();
    if (error) {
      setMsg(error.message);
      return;
    }
    setNewRoomName("");
    await seedRooms(shopId, [...rooms, data as Room]);
    qc.invalidateQueries({ queryKey: roomKeys.all(shopId) });
  }

  async function handleDelete(roomId: string) {
    if (!shopId) return;
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("room_id", roomId);
    if ((count ?? 0) > 0) {
      setMsg(
        `Cannot delete — ${count} product(s) in this room. Move them first.`,
      );
      return;
    }
    await supabase.from("rooms").delete().eq("id", roomId);
    const updated = rooms.filter((r) => r.id !== roomId);
    await seedRooms(shopId, updated);
    qc.invalidateQueries({ queryKey: roomKeys.all(shopId) });
  }

  return (
    <>
      {rooms.length === 0 ? (
        <p
          className="text-sm mb-4"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          No rooms yet.
        </p>
      ) : (
        <div className="mb-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between py-2.5"
              style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
            >
              <span className="text-sm">{room.name}</span>
              <button
                onClick={() => handleDelete(room.id)}
                className="btn btn-ghost btn-sm btn-icon"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
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
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="input flex-1"
          type="text"
          placeholder="New room name…"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn-secondary"
          disabled={!newRoomName.trim()}
        >
          Add room
        </button>
      </form>
      {msg && (
        <p className="text-sm mt-2" style={{ color: "var(--color-danger)" }}>
          {msg}
        </p>
      )}
    </>
  );
}
