"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useCustomers } from "@/hooks/useCustomers";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SearchBar } from "@/components/ui/SearchBar";

export default function CustomersPage() {
  const shopId = useAuthStore(selectShopId);
  const { data: customers = [], isLoading } = useCustomers(shopId);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)),
    );
  }, [customers, search]);

  const totalDebt = useMemo(
    () =>
      customers.reduce((sum, c) => sum + (c.balance < 0 ? -c.balance : 0), 0),
    [customers],
  );

  const inDebtCount = customers.filter((c) => c.balance < 0).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Customers
          </h1>
          <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
            {customers.length} total
            {inDebtCount > 0 && (
              <span style={{ color: "var(--color-danger)" }}>
                {" "}
                · {inDebtCount} in debt
              </span>
            )}
          </p>
        </div>
        <Link href="/customers/new" className="btn btn-primary btn-sm">
          + Add customer
        </Link>
      </div>

      {/* Stats */}
      {inDebtCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="card p-4">
            <p
              className="text-xs uppercase tracking-wider mb-1"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Total outstanding
            </p>
            <p
              className="text-xl font-semibold"
              style={{ color: "var(--color-danger)" }}
            >
              {formatCurrency(totalDebt)}
            </p>
          </div>
          <div className="card p-4">
            <p
              className="text-xs uppercase tracking-wider mb-1"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Customers in debt
            </p>
            <p className="text-xl font-semibold">{inDebtCount}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name or phone…"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="card">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 mx-4 my-2 rounded-lg animate-pulse-soft"
              style={{ background: "var(--color-surface-2)" }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p
            className="text-lg mb-1"
            style={{ color: "var(--color-ink-secondary)" }}
          >
            {search ? "No customers match your search" : "No customers yet"}
          </p>
          {!search && (
            <p
              className="text-sm"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Customers are created when you record a credit or partial sale in
              POS, or via the Add customer button.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="sm:hidden space-y-2">
            {filtered.map((c) => (
              <Link
                key={c.id}
                href={`/customers/${c.id}`}
                className="card px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
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
                </div>
                <div className="text-right flex-shrink-0">
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
              </Link>
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
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td
                      className="font-medium"
                      style={{ color: "var(--color-ink-primary)" }}
                    >
                      {c.name}
                    </td>
                    <td
                      style={{
                        color: "var(--color-ink-secondary)",
                        fontSize: 13,
                      }}
                    >
                      {c.phone || "—"}
                    </td>
                    <td
                      style={{
                        color: "var(--color-ink-tertiary)",
                        fontSize: 12,
                      }}
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
                      {c.balance === 0
                        ? "—"
                        : formatCurrency(Math.abs(c.balance))}
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
                      <Link
                        href={`/customers/${c.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: 12 }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
