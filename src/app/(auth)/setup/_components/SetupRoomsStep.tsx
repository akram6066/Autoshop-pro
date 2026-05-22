interface Props {
  rooms: string[];
  newRoom: string;
  error: string;
  isPending: boolean;
  mounted: boolean;
  onNewRoomChange: (v: string) => void;
  onAddRoom: () => void;
  onRemoveRoom: (name: string) => void;
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
  onSubmit,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="p-6">
      <h2 className="text-lg font-medium mb-1">Storage rooms</h2>
      <p
        className="text-sm mb-5"
        style={{ color: "var(--color-ink-secondary)" }}
      >
        Rooms help you organise where parts are stored. Add as many as you need.
      </p>

      <div className="space-y-2 mb-4">
        {rooms.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-ink-ghost)" }}>
            No rooms added yet. Add at least one below.
          </p>
        )}
        {rooms.map((name) => (
          <div
            key={name}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg"
            style={{
              background: "var(--color-surface-1)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span className="text-sm">{name}</span>
            <button
              type="button"
              onClick={() => onRemoveRoom(name)}
              className="btn btn-ghost btn-sm btn-icon"
              aria-label={`Remove ${name}`}
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
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="input flex-1"
          type="text"
          placeholder="Room name…"
          value={newRoom}
          onChange={(e) => onNewRoomChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddRoom();
            }
          }}
        />
        <button type="button" onClick={onAddRoom} className="btn btn-secondary">
          Add
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary w-full mt-6"
        disabled={!mounted || isPending || rooms.length === 0}
      >
        {isPending
          ? "Setting up…"
          : `Continue with ${rooms.length} room${rooms.length !== 1 ? "s" : ""} →`}
      </button>
    </form>
  );
}
