interface Props {
  isAddingNew: boolean;
}

export default function SetupDoneStep({ isAddingNew }: Props) {
  return (
    <div className="p-8 text-center animate-scale-in">
      <div
        className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
        style={{ background: "var(--color-success-light)" }}
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
          <path
            d="M5 12l5 5L20 7"
            stroke="var(--color-success)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="text-xl font-medium mb-2">
        {isAddingNew ? "New shop created!" : "You're all set!"}
      </h2>
      <p className="text-sm" style={{ color: "var(--color-ink-secondary)" }}>
        {isAddingNew
          ? "Taking you to your overview…"
          : "Taking you to your dashboard…"}
      </p>
    </div>
  );
}
