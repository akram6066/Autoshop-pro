"use client";

import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import type { Customer } from "@/types/app";

export function CustomerSelector({
  customers,
  selectedCustomer,
  search,
  onSearchChange,
  onSelect,
  onClear,
  onCreateAndSelect,
  isCreating,
  error,
}: {
  customers: Customer[];
  selectedCustomer: Customer | null;
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (c: Customer) => void;
  onClear: () => void;
  onCreateAndSelect: (name: string) => void;
  isCreating: boolean;
  error: boolean;
}) {
  const results = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return [];
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)),
      )
      .slice(0, 5);
  }, [customers, search]);

  if (selectedCustomer) {
    return (
      <div
        className="flex items-center justify-between px-2.5 py-2 rounded-lg"
        style={{
          background: "var(--color-brand-50)",
          border: "1px solid var(--color-brand-200)",
        }}
      >
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-medium truncate"
            style={{ color: "var(--color-brand-700)" }}
          >
            {selectedCustomer.name}
          </p>
          <p
            className="text-xs"
            style={{
              color:
                selectedCustomer.balance < 0
                  ? "var(--color-danger)"
                  : "var(--color-ink-tertiary)",
            }}
          >
            Balance:{" "}
            {selectedCustomer.balance === 0
              ? "KES 0"
              : `${selectedCustomer.balance < 0 ? "−" : "+"}${formatCurrency(Math.abs(selectedCustomer.balance))}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="btn btn-ghost btn-sm btn-icon ml-2"
          style={{ color: "var(--color-ink-ghost)", flexShrink: 0 }}
          aria-label="Remove customer"
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search customer by name or phone…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="input w-full text-sm"
        style={error ? { borderColor: "var(--color-danger)" } : undefined}
      />
      {error && (
        <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>
          Select or create a customer
        </p>
      )}
      {search.trim() && (
        <div
          className="mt-1 rounded-lg overflow-hidden"
          style={{
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-0)",
          }}
        >
          {results.map((c, idx) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              className="w-full text-left px-3 py-2 text-sm transition-colors"
              style={{
                borderBottom:
                  idx < results.length - 1
                    ? "1px solid var(--color-border-subtle)"
                    : "none",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--color-surface-2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
              }}
            >
              <span
                className="font-medium"
                style={{ color: "var(--color-ink-primary)" }}
              >
                {c.name}
              </span>
              {c.phone && (
                <span
                  className="text-xs ml-2"
                  style={{ color: "var(--color-ink-tertiary)" }}
                >
                  {c.phone}
                </span>
              )}
              {c.balance !== 0 && (
                <span
                  className="float-right text-xs"
                  style={{
                    color:
                      c.balance < 0
                        ? "var(--color-danger)"
                        : "var(--color-success)",
                  }}
                >
                  {c.balance < 0 ? "−" : "+"}
                  {formatCurrency(Math.abs(c.balance))}
                </span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onCreateAndSelect(search.trim())}
            disabled={isCreating}
            className="w-full text-left px-3 py-2 text-sm"
            style={{
              color: "var(--color-brand-600)",
              borderTop:
                results.length > 0
                  ? "1px solid var(--color-border-subtle)"
                  : "none",
              background: "transparent",
            }}
          >
            {isCreating ? "Creating…" : `+ Create "${search.trim()}"`}
          </button>
        </div>
      )}
    </div>
  );
}
