"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import {
  useCustomer,
  useCustomerSales,
  useCustomerPayments,
  useUpdateCustomer,
  useDeleteCustomer,
  useRecordCustomerPayment,
} from "@/hooks/useCustomers";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/types/app";
import { friendlyError } from "@/lib/api/errors";

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────

function DeleteDialog({
  customerName,
  isPending,
  onConfirm,
  onCancel,
}: {
  customerName: string;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onCancel}
    >
      <div
        className="card w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-lg font-semibold mb-2"
          style={{ color: "var(--color-ink-primary)" }}
        >
          Delete customer?
        </h2>
        <p
          className="text-sm mb-6"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          <strong>{customerName}</strong> and all their payment records will be
          permanently removed. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="btn btn-sm flex-1"
            style={{
              background: "var(--color-danger)",
              color: "#fff",
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? "Deleting…" : "Delete"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="btn btn-secondary btn-sm flex-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Record Payment Form ──────────────────────────────────────────────────────

function RecordPaymentForm({
  shopId,
  customerId,
  userId,
  balance,
}: {
  shopId: string;
  customerId: string;
  userId: string;
  balance: number;
}) {
  const { mutateAsync: recordPayment, isPending } = useRecordCustomerPayment();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const parsed = parseFloat(amount);
  const isValid = !isNaN(parsed) && parsed > 0;

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
        customerId,
        userId,
        amount: parsed,
        note: note || undefined,
      });
      setAmount("");
      setNote("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(friendlyError(err, "Failed to record payment"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: "var(--color-ink-secondary)" }}
          >
            Amount (KES)
          </label>
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
          />
        </div>
        <div className="flex-1">
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
      </div>

      {isValid && balance < 0 && (
        <p className="text-xs" style={{ color: "var(--color-ink-tertiary)" }}>
          Balance after:{" "}
          <span
            style={{
              color:
                balance + parsed >= 0
                  ? "var(--color-success)"
                  : "var(--color-danger)",
            }}
          >
            {formatCurrency(balance + parsed)}
          </span>
        </p>
      )}

      {error && (
        <p className="text-sm" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm" style={{ color: "var(--color-success)" }}>
          Payment recorded.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !isValid}
        className="btn btn-primary btn-sm"
      >
        {isPending ? "Saving…" : "Record payment"}
      </button>
    </form>
  );
}

// ─── Edit Form ────────────────────────────────────────────────────────────────

function EditCustomerForm({
  shopId,
  customerId,
  initialName,
  initialPhone,
  onSaved,
}: {
  shopId: string;
  customerId: string;
  initialName: string;
  initialPhone: string | null;
  onSaved: () => void;
}) {
  const { mutateAsync: updateCustomer, isPending } = useUpdateCustomer();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    try {
      await updateCustomer({
        shopId,
        customerId,
        changes: { name: name.trim(), phone: phone.trim() || null },
      });
      onSaved();
    } catch (err: unknown) {
      setError(friendlyError(err, "Failed to save"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">Full name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Phone</label>
        <input
          className="input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Optional"
        />
      </div>
      {error && (
        <p className="text-sm" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={isPending || !name.trim()}
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onSaved}
          className="btn btn-secondary btn-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const shopId = useAuthStore(selectShopId);
  const user = useAuthStore((s) => s.user);
  const { data: customer, isLoading } = useCustomer(shopId, id);
  const { data: sales = [] } = useCustomerSales(shopId, id);
  const { data: payments = [] } = useCustomerPayments(shopId, id);
  const { mutateAsync: deleteCustomer, isPending: isDeleting } =
    useDeleteCustomer();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleDelete() {
    if (!shopId) return;
    await deleteCustomer({ shopId, customerId: id });
    router.replace("/customers");
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl">
        <div
          className="h-8 w-32 rounded-lg animate-pulse-soft mb-6"
          style={{ background: "var(--color-surface-2)" }}
        />
        <div className="card p-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-6 rounded-lg animate-pulse-soft mb-3"
              style={{ background: "var(--color-surface-2)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-48">
        <p style={{ color: "var(--color-ink-tertiary)" }}>Customer not found</p>
      </div>
    );
  }

  const isInDebt = customer.balance < 0;
  const hasCredit = customer.balance > 0;

  return (
    <div className="max-w-2xl">
      {confirmingDelete && (
        <DeleteDialog
          customerName={customer.name}
          isPending={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}

      {/* Back */}
      <Link
        href="/customers"
        className="btn btn-ghost btn-sm mb-6"
        style={{ color: "var(--color-ink-tertiary)" }}
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path
            d="M19 12H5M12 5l-7 7 7 7"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Customers
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--color-ink-primary)" }}
          >
            {customer.name}
          </h1>
          {customer.phone && (
            <p
              className="text-sm"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              {customer.phone}
            </p>
          )}
        </div>
        {!editing && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn btn-secondary btn-sm"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="btn btn-sm"
              style={{
                color: "var(--color-danger)",
                border: "1px solid var(--color-danger)",
                background: "transparent",
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Balance card */}
      {!editing && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card p-4">
            <p
              className="text-xs uppercase tracking-wider mb-1"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Balance
            </p>
            <p
              className="text-2xl font-semibold"
              style={{
                color: isInDebt
                  ? "var(--color-danger)"
                  : hasCredit
                    ? "var(--color-success)"
                    : "var(--color-ink-primary)",
              }}
            >
              {customer.balance === 0
                ? "KES 0"
                : formatCurrency(Math.abs(customer.balance))}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              {isInDebt
                ? "owes this amount"
                : hasCredit
                  ? "credit balance"
                  : "all clear"}
            </p>
          </div>
          <div className="card p-4">
            <p
              className="text-xs uppercase tracking-wider mb-1"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Total sales
            </p>
            <p className="text-2xl font-semibold">{sales.length}</p>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="card p-5 mb-6 animate-fade-in">
          <EditCustomerForm
            shopId={shopId ?? ""}
            customerId={customer.id}
            initialName={customer.name}
            initialPhone={customer.phone}
            onSaved={() => setEditing(false)}
          />
        </div>
      )}

      {/* Record payment */}
      {!editing && shopId && user && (
        <div className="card p-5 mb-6">
          <h2
            className="font-medium text-sm mb-4"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Record payment
            {isInDebt && (
              <span
                className="ml-2 text-xs font-normal"
                style={{ color: "var(--color-danger)" }}
              >
                Owes {formatCurrency(-customer.balance)}
              </span>
            )}
          </h2>
          <RecordPaymentForm
            shopId={shopId}
            customerId={customer.id}
            userId={user.id}
            balance={customer.balance}
          />
        </div>
      )}

      {/* Sales history */}
      {!editing && (
        <div className="card overflow-x-auto mb-6 animate-fade-in-up">
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <h2 className="font-medium text-sm">Sales history</h2>
          </div>
          {sales.length === 0 ? (
            <p
              className="p-5 text-sm"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              No sales recorded yet.
            </p>
          ) : (
            <table className="table-auto-shop" style={{ minWidth: 400 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Method</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th style={{ textAlign: "right" }}>Paid</th>
                  <th style={{ textAlign: "right" }}>Debt</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => {
                  const debt = s.total_amount - s.amount_paid;
                  return (
                    <tr key={s.id}>
                      <td
                        style={{
                          fontSize: 12,
                          color: "var(--color-ink-tertiary)",
                        }}
                      >
                        {formatDate(s.created_at)}
                      </td>
                      <td>
                        <span className="badge">
                          {PAYMENT_METHOD_LABELS[
                            s.payment_method as PaymentMethod
                          ] ?? s.payment_method}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 500 }}>
                        {formatCurrency(s.total_amount)}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          color: "var(--color-ink-secondary)",
                        }}
                      >
                        {formatCurrency(s.amount_paid)}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          color:
                            debt > 0
                              ? "var(--color-danger)"
                              : "var(--color-ink-tertiary)",
                        }}
                      >
                        {debt > 0 ? formatCurrency(debt) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Payment history */}
      {!editing && (
        <div
          className="card overflow-x-auto animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <h2 className="font-medium text-sm">Payment history</h2>
          </div>
          {payments.length === 0 ? (
            <p
              className="p-5 text-sm"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              No payments recorded yet.
            </p>
          ) : (
            <table className="table-auto-shop">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Note</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td
                      style={{
                        fontSize: 12,
                        color: "var(--color-ink-tertiary)",
                      }}
                    >
                      {formatDateTime(p.created_at)}
                    </td>
                    <td
                      style={{
                        color: "var(--color-ink-secondary)",
                        fontSize: 13,
                      }}
                    >
                      {p.note || "—"}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 500,
                        color: "var(--color-success)",
                      }}
                    >
                      +{formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
