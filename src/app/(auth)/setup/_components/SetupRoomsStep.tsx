import { useState } from "react";

interface Props {
  rooms: string[];
  newRoom: string;
  error: string;
  isPending: boolean;
  mounted: boolean;
  onNewRoomChange: (v: string) => void;
  onAddRoom: () => void;
  onRemoveRoom: (name: string) => void;
  onEditRoom?: (oldName: string, newName: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function SetupRoomsStep({
  rooms,
  newRoom,
  error,
  isPending,
  mounted,
  onNewRoomChange,
  onAddRoom,
  onRemoveRoom,
  onEditRoom,
  onSubmit,
}: Props) {
  const [editingRoom, setEditingRoom] = useState<string | null>(null);

  function handleSaveOrAdd() {
    if (editingRoom && onEditRoom) {
      const trimmed = newRoom.trim();
      if (!trimmed) return;
      onEditRoom(editingRoom, trimmed);
      setEditingRoom(null);
    } else {
      onAddRoom();
    }
  }

  return (
    <form onSubmit={onSubmit} className="p-8 sm:p-10">
      <h2 className="text-2xl font-display font-medium mb-2">Locations</h2>
      <p
        className="text-base mb-6"
        style={{ color: "var(--color-ink-secondary)" }}
      >
        Locations help you organise where parts are stored. Add or rename as
        many as you need.
      </p>

      <div className="space-y-2 mb-4">
        {rooms.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-ink-ghost)" }}>
            No locations added yet. Add at least one below.
          </p>
        )}
        {rooms.map((name) => {
          const isEditingThis = editingRoom === name;
          return (
            <div
              key={name}
              className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300"
              style={{
                background: "var(--color-surface-1)",
                border: isEditingThis
                  ? "1px solid var(--color-brand-500)"
                  : "1px solid var(--color-border)",
              }}
            >
              <span
                className="text-sm truncate pr-2"
                style={{
                  color: isEditingThis
                    ? "var(--color-brand-600)"
                    : "var(--color-ink-primary)",
                  fontWeight: isEditingThis ? 600 : 400,
                }}
              >
                {name}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {onEditRoom && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRoom(name);
                      onNewRoomChange(name);
                    }}
                    className="btn btn-ghost btn-sm btn-icon"
                    aria-label={`Edit ${name}`}
                    title={`Edit ${name}`}
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
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (editingRoom === name) {
                      setEditingRoom(null);
                      onNewRoomChange("");
                    }
                    onRemoveRoom(name);
                  }}
                  className="btn btn-ghost btn-sm btn-icon"
                  aria-label={`Remove ${name}`}
                  title={`Remove ${name}`}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          className="input flex-1 text-base py-3"
          type="text"
          placeholder={editingRoom ? "Edit location name…" : "Location name…"}
          value={newRoom}
          onChange={(e) => onNewRoomChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSaveOrAdd();
            }
          }}
        />
        <button
          type="button"
          onClick={handleSaveOrAdd}
          className={`btn ${editingRoom ? "btn-primary" : "btn-secondary"} px-6 font-medium`}
        >
          {editingRoom ? "Update" : "Add"}
        </button>
        {editingRoom && (
          <button
            type="button"
            onClick={() => {
              setEditingRoom(null);
              onNewRoomChange("");
            }}
            className="btn btn-secondary px-4 font-medium"
          >
            Cancel
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary w-full mt-8 py-3 text-base shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
        disabled={!mounted || isPending || rooms.length === 0}
      >
        {isPending
          ? "Setting up…"
          : `Continue with ${rooms.length} location${rooms.length !== 1 ? "s" : ""} →`}
      </button>
    </form>
  );
}
