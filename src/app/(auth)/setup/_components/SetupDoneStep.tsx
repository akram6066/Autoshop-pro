interface Props {
  isAddingNew: boolean;
}

export default function SetupDoneStep({ isAddingNew }: Props) {
  return (
    <div className="p-10 sm:p-14 text-center animate-scale-in">
      <div
        className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 shadow-[0_0_40px_rgba(22,163,74,0.3)] dark:shadow-[0_0_40px_rgba(74,222,128,0.2)] transition-all"
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
      <h2 className="text-3xl font-display font-medium mb-3">
        {isAddingNew ? "New shop created!" : "You're all set!"}
      </h2>
      <p className="text-base" style={{ color: "var(--color-ink-secondary)" }}>
        {isAddingNew
          ? "Taking you to your overview…"
          : "Taking you to your dashboard…"}
      </p>
    </div>
  );
}
