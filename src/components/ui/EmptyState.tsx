import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center p-8 rounded-lg animate-fade-in"
      style={{
        border: "1px dashed var(--color-border)",
        background: "var(--color-surface-1)",
      }}
    >
      <div
        className="flex items-center justify-center w-12 h-12 rounded-full mb-4"
        style={{
          background: "var(--color-surface-2)",
          color: "var(--color-ink-tertiary)",
        }}
      >
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <h3
        className="text-sm font-semibold mb-1"
        style={{ color: "var(--color-ink-primary)" }}
      >
        {title}
      </h3>
      <p
        className="text-sm max-w-sm mb-5"
        style={{ color: "var(--color-ink-secondary)" }}
      >
        {description}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="btn btn-secondary btn-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
