"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useCustomers, useRecordCustomerPayment } from "@/hooks/useCustomers";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SearchBar } from "@/components/ui/SearchBar";
import { friendlyError } from "@/lib/api/errors";
import type { Customer } from "@/types/app";

// ─── Collect Debt Modal ───────────────────────────────────────────────────────

function CollectDebtModal({
  customer,
  shopId,
  userId,
  onClose,
}: {
  customer: Customer;
  shopId: string;
  userId: string;
  onClose: () => void;
}) {
  const { mutateAsync: recordPayment, isPending } = useRecordCustomerPayment();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [finalBalance, setFinalBalance] = useState<number | null>(null);

  const owed = Math.abs(customer.balance);
  const parsed = parseFloat(amount);
  const isValid = !isNaN(parsed) && parsed > 0;
  const balanceAfter = isValid ? customer.balance + parsed : null;
  const succeeded = finalBalance !== null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, isPending]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setError("Enter a valid amount above 0");
      return;
    }
    setError("");
    try {
      await recordPayment({
        shopId,
        customerId: customer.id,
        userId,
        amount: parsed,
        note: note.trim() || undefined,
      });
      setFinalBalance(customer.balance + parsed);
      setTimeout(onClose, 1400);
    } catch (err: unknown) {
      setError(friendlyError(err, "Failed to record payment"));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={() => !isPending && !succeeded && onClose()}
    >
      <div
        className="card w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--color-ink-primary)" }}
            >
              Collect payment
            </h2>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              {customer.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Close"
            className="btn btn-icon btn-ghost"
            style={{ marginTop: -4, marginRight: -8 }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Outstanding debt summary */}
        <div
          className="rounded-lg px-4 py-3 mb-5"
          style={{
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.18)",
          }}
        >
          <p
            className="text-xs uppercase tracking-wider mb-0.5"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            Outstanding debt
          </p>
          <p
            className="text-2xl font-semibold"
            style={{ color: "var(--color-danger)" }}
          >
            {formatCurrency(owed)}
          </p>
        </div>

        {/* Success state */}
        {succeeded ? (
          <div className="text-center py-3">
            <p
              className="text-base font-semibold"
              style={{ color: "var(--color-success)" }}
            >
              Payment recorded
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              {finalBalance >= 0
                ? "Account is now settled."
                : `${formatCurrency(Math.abs(finalBalance))} still remaining`}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--color-ink-secondary)" }}
                >
                  Amount (KES)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAmount(String(owed));
                    setError("");
                  }}
                  className="text-xs font-medium"
                  style={{ color: "var(--color-brand-600)" }}
                >
                  Pay in full
                </button>
              </div>
              <input
                type="number"
                min="1"
                step="50"
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                className="input w-full"
                autoFocus
              />
            </div>

            {/* Note */}
            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--color-ink-secondary)" }}
              >
                Note (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Cash received"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input w-full"
              />
            </div>

            {/* Balance preview */}
            {isValid && balanceAfter !== null && (
              <p
                className="text-xs"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                Balance after:{" "}
                <span
                  style={{
                    fontWeight: 500,
                    color:
                      balanceAfter >= 0
                        ? "var(--color-success)"
                        : "var(--color-danger)",
                  }}
                >
                  {balanceAfter >= 0
                    ? "Settled"
                    : `${formatCurrency(Math.abs(balanceAfter))} remaining`}
                </span>
              </p>
            )}

            {error && (
              <p className="text-sm" style={{ color: "var(--color-danger)" }}>
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isPending || !isValid}
                className="btn btn-primary btn-sm flex-1"
              >
                {isPending ? "Saving…" : "Record payment"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const shopId = useAuthStore(selectShopId);
  const user = useAuthStore((s) => s.user);
  const { data: customers = [], isLoading, isError } = useCustomers(shopId);
  const [search, setSearch] = useState("");
  const [collectTarget, setCollectTarget] = useState<Customer | null>(null);

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
      {/* Collect debt modal */}
      {collectTarget && shopId && user && (
        <CollectDebtModal
          customer={collectTarget}
          shopId={shopId}
          userId={user.id}
          onClose={() => setCollectTarget(null)}
        />
      )}

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
      ) : isError ? (
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
                      onClick={() => setCollectTarget(c)}
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
                      <div className="flex items-center justify-end gap-2">
                        {c.balance < 0 && (
                          <button
                            type="button"
                            onClick={() => setCollectTarget(c)}
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
      )}
    </div>
  );
}
