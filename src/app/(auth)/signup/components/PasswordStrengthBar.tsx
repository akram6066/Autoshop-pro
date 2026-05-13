export function getStrength(pwd: string): 0 | 1 | 2 | 3 | 4 {
  if (!pwd) return 0;
  if (pwd.length < 8) return 1;
  let score = 1;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

const STRENGTH_CONFIG = {
  0: { label: "", color: "transparent" },
  1: { label: "Too short", color: "var(--color-danger)" },
  2: { label: "Weak", color: "var(--color-warning)" },
  3: { label: "Good", color: "var(--color-brand-500)" },
  4: { label: "Strong", color: "var(--color-success)" },
} as const;

export default function PasswordStrengthBar({
  password,
}: {
  password: string;
}) {
  const level = getStrength(password);
  const cfg = STRENGTH_CONFIG[level];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
        {([1, 2, 3, 4] as const).map((n) => (
          <div
            key={n}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: n <= level ? cfg.color : "var(--color-surface-3)",
              transition: "background 0.25s",
            }}
          />
        ))}
      </div>
      {cfg.label && (
        <p style={{ fontSize: "0.75rem", color: cfg.color, fontWeight: 500 }}>
          {cfg.label}
        </p>
      )}
    </div>
  );
}
