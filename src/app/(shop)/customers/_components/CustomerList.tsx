import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Customer } from "@/types/app";

interface Props {
  customers: Customer[];
  isLoading: boolean;
  isError: boolean;
  search: string;
  onCollect: (customer: Customer) => void;
}

export function CustomerList({
  customers,
  isLoading,
  isError,
  search,
  onCollect,
}: Props) {
  if (isLoading) {
    return (
      <div className="card">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 mx-4 my-2 rounded-lg animate-pulse-soft"
            style={{ background: "var(--color-skeleton-subtle)" }}
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-8 text-center">
        <p
          className="font-medium mb-1"
          style={{ color: "var(--color-danger)" }}
        >
          Could not load customers
        </p>
        <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
          Check your connection and try refreshing the page.
        </p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p
          className="text-lg mb-1"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          {search ? "No customers match your search" : "No customers yet"}
        </p>
        {!search && (
          <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
            Customers are created when you record a credit or partial sale in
            POS, or via the Add customer button.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="sm:hidden space-y-2">
        {customers.map((c) => (
          <div
            key={c.id}
            className="card px-4 py-3 flex items-center justify-between gap-3"
          >
            <Link href={`/customers/${c.id}`} className="min-w-0 flex-1">
              <p
                className="font-medium text-sm truncate"
                style={{ color: "var(--color-ink-primary)" }}
              >
                {c.name}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                {c.phone || formatDate(c.created_at)}
              </p>
            </Link>

            <div className="flex items-center gap-2 flex-shrink-0">
              {c.balance < 0 && (
                <button
                  type="button"
                  onClick={() => onCollect(c)}
                  className="btn btn-sm"
                  style={{
                    background: "var(--color-danger)",
                    color: "#fff",
                    fontSize: 12,
                  }}
                >
                  Collect
                </button>
              )}
              <div className="text-right">
                {c.balance !== 0 ? (
                  <p
                    className="text-sm font-medium"
                    style={{
                      color:
                        c.balance < 0
                          ? "var(--color-danger)"
                          : "var(--color-success)",
                    }}
                  >
                    {c.balance < 0 ? "Owes " : "Credit "}
                    {formatCurrency(Math.abs(c.balance))}
                  </p>
                ) : (
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-ink-ghost)" }}
                  >
                    —
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block card overflow-hidden">
        <table className="table-auto-shop">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Joined</th>
              <th style={{ textAlign: "right" }}>Balance</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td
                  className="font-medium"
                  style={{ color: "var(--color-ink-primary)" }}
                >
                  {c.name}
                </td>
                <td
                  style={{ color: "var(--color-ink-secondary)", fontSize: 13 }}
                >
                  {c.phone || "—"}
                </td>
                <td
                  style={{ color: "var(--color-ink-tertiary)", fontSize: 12 }}
                >
                  {formatDate(c.created_at)}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    fontWeight: 500,
                    color:
                      c.balance < 0
                        ? "var(--color-danger)"
                        : c.balance > 0
                          ? "var(--color-success)"
                          : "var(--color-ink-tertiary)",
                  }}
                >
                  {c.balance === 0 ? "—" : formatCurrency(Math.abs(c.balance))}
                  {c.balance < 0 && (
                    <span
                      className="ml-1 text-xs"
                      style={{ color: "var(--color-danger)" }}
                    >
                      owed
                    </span>
                  )}
                  {c.balance > 0 && (
                    <span
                      className="ml-1 text-xs"
                      style={{ color: "var(--color-success)" }}
                    >
                      credit
                    </span>
                  )}
                </td>
                <td>
                  <div className="flex items-center justify-end gap-2">
                    {c.balance < 0 && (
                      <button
                        type="button"
                        onClick={() => onCollect(c)}
                        className="btn btn-sm"
                        style={{
                          background: "var(--color-danger)",
                          color: "#fff",
                          fontSize: 12,
                        }}
                      >
                        Collect
                      </button>
                    )}
                    <Link
                      href={`/customers/${c.id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 12 }}
                    >
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}


