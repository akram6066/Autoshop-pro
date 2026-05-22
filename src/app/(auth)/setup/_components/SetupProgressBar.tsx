type StepDef = { key: string; label: string; num: number };

interface Props {
  steps: readonly StepDef[];
  currentStepIdx: number;
}

export default function SetupProgressBar({ steps, currentStepIdx }: Props) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300"
              style={{
                background:
                  i <= currentStepIdx
                    ? "var(--color-brand-500)"
                    : "var(--color-surface-3)",
                color:
                  i <= currentStepIdx ? "white" : "var(--color-ink-tertiary)",
              }}
            >
              {i < currentStepIdx ? (
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M5 12l5 5L20 7"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                s.num
              )}
            </div>
            <span
              className="text-sm hidden sm:block"
              style={{
                color:
                  i <= currentStepIdx
                    ? "var(--color-ink-primary)"
                    : "var(--color-ink-ghost)",
                fontWeight: i === currentStepIdx ? 500 : 400,
              }}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="w-8 h-px"
              style={{
                background:
                  i < currentStepIdx
                    ? "var(--color-brand-400)"
                    : "var(--color-border)",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
