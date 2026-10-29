"use client";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import {
  useRooms,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
} from "@/hooks/useRooms";
import type { Room } from "@/types/app";
import { friendlyError } from "@/lib/api/errors";

export function RoomsSection() {
  const supabase = createClient();
  const shopId = useAuthStore(selectShopId);
  const { data: rooms = [] } = useRooms(shopId);
  const { mutateAsync: createRoom, isPending: isCreating } =
    useCreateRoom(shopId);
  const { mutateAsync: updateRoom, isPending: isUpdating } =
    useUpdateRoom(shopId);
  const { mutateAsync: deleteRoom } = useDeleteRoom(shopId);

  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Room | null>(null);
  const [msg, setMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !shopId) return;
    setMsg("");

    const duplicate = rooms.some(
      (r) =>
        r.name.toLowerCase() === trimmed.toLowerCase() &&
        (!editing || r.id !== editing.id),
    );
    if (duplicate) {
      setMsg("A location with this name already exists.");
      return;
    }

    try {
      if (editing) {
        await updateRoom({ roomId: editing.id, name: trimmed });
        toast.success(`Location renamed to "${trimmed}".`);
        setEditing(null);
      } else {
        await createRoom({ name: trimmed });
        toast.success(`Location "${trimmed}" added.`);
      }
      setName("");
    } catch (err: unknown) {
      setMsg(friendlyError(err, "Failed to save location."));
    }
  }

  async function handleDelete(roomId: string) {
    if (!shopId) return;
    setMsg("");
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("room_id", roomId)
      .eq("is_archived", false);
    if ((count ?? 0) > 0) {
      setMsg(
        `Cannot delete — ${count} product(s) in this location. Move them first.`,
      );
      return;
    }
    try {
      await deleteRoom({ roomId });
      if (editing?.id === roomId) {
        setEditing(null);
        setName("");
      }
      toast.success("Location deleted.");
    } catch (err: unknown) {
      setMsg(friendlyError(err, "Failed to delete location."));
    }
  }

  const isSaving = isCreating || isUpdating;

  return (
    <>
      <p
        className="text-sm mb-4"
        style={{ color: "var(--color-ink-tertiary)" }}
      >
        Locations help organise where parts are stored (e.g. Showroom, Main
        Store, Warehouse).
      </p>
      {rooms.length === 0 ? (
        <p
          className="text-sm mb-4"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          No locations yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 mb-4">
          {rooms.map((room) => {
            const isBeingEdited = editing?.id === room.id;
            return (
              <div
                key={room.id}
                className="flex items-center justify-between py-2.5"
                style={{
                  borderBottom: "1px solid var(--color-border-subtle)",
                }}
              >
                <span
                  className="text-sm truncate pr-2"
                  style={{
                    color: isBeingEdited
                      ? "var(--color-brand-600)"
                      : "var(--color-ink-primary)",
                    fontWeight: isBeingEdited ? 600 : 400,
                  }}
                >
                  {room.name}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(room);
                      setName(room.name);
                      setMsg("");
                      setTimeout(() => inputRef.current?.focus(), 0);
                    }}
                    className="btn btn-ghost btn-sm btn-icon"
                    title={`Edit ${room.name}`}
                    aria-label={`Edit ${room.name}`}
                  >
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                      <path
                        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(room.id)}
                    className="btn btn-ghost btn-sm btn-icon"
                    style={{ color: "var(--color-danger)" }}
                    title={`Delete ${room.name}`}
                    aria-label={`Delete ${room.name}`}
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
              </div>
            );
          })}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          ref={inputRef}
          className="input w-full sm:flex-1"
          type="text"
          placeholder={editing ? "Edit location name…" : "New location name…"}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className={`btn ${editing ? "btn-primary" : "btn-secondary"} flex-1 sm:flex-none`}
            disabled={!name.trim() || isSaving}
          >
            {editing ? "Update" : "Add location"}
          </button>
          {editing && (
            <button
              type="button"
              className="btn btn-secondary flex-1 sm:flex-none"
              onClick={() => {
                setEditing(null);
                setName("");
                setMsg("");
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      {msg && (
        <p className="text-sm mt-2" style={{ color: "var(--color-danger)" }}>
          {msg}
        </p>
      )}
    </>
  );
}
