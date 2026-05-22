"use client";

interface Props {
  currentEmail: string | undefined;
  email: string;
  isEmailPending: boolean;
  mounted: boolean;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChangeEmailSection({
  currentEmail,
  email,
  isEmailPending,
  mounted,
  onChange,
  onSubmit,
}: Props) {
  return (
    <div>
      <h3
        className="text-sm font-semibold mb-3"
        style={{ color: "var(--color-ink-primary)" }}
      >
        Change Email Address
      </h3>
      <p
        className="text-sm mb-4"
        style={{ color: "var(--color-ink-secondary)" }}
      >
        Current email:{" "}
        <strong style={{ color: "var(--color-ink-primary)" }}>
          {currentEmail}
        </strong>
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--color-ink-primary)" }}
          >
            New Email Address
          </label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => {
              onChange(e.target.value);
            }}
            placeholder="e.g. new@example.com"
            required
          />
        </div>

        <div>
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={!mounted || isEmailPending || !email.trim()}
          >
            {isEmailPending ? "Sending…" : "Update Email"}
          </button>
        </div>
      </form>
    </div>
  );
}
