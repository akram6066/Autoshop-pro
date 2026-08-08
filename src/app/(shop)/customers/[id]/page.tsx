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
} from "@/hooks/useCustomers";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/types/app";
import { friendlyError } from "@/lib/api/errors";
import { CollectDebtModal } from "@/components/customers/CollectDebtModal";
import type { Customer } from "@/types/app";
import type {
  CustomerSaleRow as CustomerSale,
  CustomerPaymentRow as CustomerPayment,
} from "@/hooks/useCustomers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeleteDialogProps {
  customerName: string;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

interface EditFormProps {
  shopId: string;
  customerId: string;
  initialName: string;
  initialPhone: string | null;
  onSaved: () => void;
}

interface CustomerHeaderProps {
  customer: Customer;
  editing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

interface MetricCardsProps {
  customer: Customer;
  salesCount: number;
}

interface CollectBannerProps {
  customer: Customer;
  onCollect: () => void;
}

interface SalesHistoryProps {
  sales: CustomerSale[];
}

interface PaymentHistoryProps {
  payments: CustomerPayment[];
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────

function DeleteDialog({
  customerName,
  isPending,
  onConfirm,
  onCancel,
}: DeleteDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm customer deletion"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm p-6 rounded-2xl"
        style={{
          background: "var(--color-popup-bg, #ffffff)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--color-popup-shadow, 0 8px 32px rgba(0,0,0,0.18))",
        }}
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

// ─── Edit Form ────────────────────────────────────────────────────────────────

function EditCustomerForm({
  shopId,
  customerId,
  initialName,
  initialPhone,
  onSaved,
}: EditFormProps) {
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

// ─── Customer Header ──────────────────────────────────────────────────────────

function CustomerHeader({
  customer,
  editing,
  onEdit,
  onDelete,
}: CustomerHeaderProps) {
  const initials = customer.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-4 min-w-0">
        {/* Avatar */}
        <div
          aria-hidden="true"
          className="flex-shrink-0 flex items-center justify-center rounded-full text-lg font-semibold"
          style={{
            width: 52,
            height: 52,
            background: "var(--color-brand-100, #e0e7ff)",
            color: "var(--color-brand-600, #4f46e5)",
          }}
        >
          {initials}
        </div>

        {/* Name + phone */}
        <div className="min-w-0">
          <h1
            className="text-xl sm:text-2xl font-semibold truncate"
            style={{ color: "var(--color-ink-primary)" }}
          >
            {customer.name}
          </h1>
          {customer.phone && (
            <p
              className="text-sm mt-0.5 truncate"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              {customer.phone}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {!editing && (
        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="btn btn-secondary btn-sm"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
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
    </header>
  );
}

// ─── Metric Cards ─────────────────────────────────────────────────────────────

function MetricCards({ customer, salesCount }: MetricCardsProps) {
  const isInDebt = customer.balance < 0;
  const hasCredit = customer.balance > 0;

  const balanceColor = isInDebt
    ? "var(--color-danger)"
    : hasCredit
      ? "var(--color-success)"
      : "var(--color-ink-primary)";

  const balanceLabel = isInDebt
    ? "owes this amount"
    : hasCredit
      ? "credit balance"
      : "all clear";

  return (
    <section
      aria-label="Customer metrics"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
    >
      {/* Balance */}
      <div className="card p-5">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          Balance
        </p>
        <p
          className="text-2xl font-bold leading-none mb-1"
          style={{ color: balanceColor }}
        >
          {customer.balance === 0
            ? "KES 0"
            : formatCurrency(Math.abs(customer.balance))}
        </p>
        <p className="text-xs" style={{ color: "var(--color-ink-tertiary)" }}>
          {balanceLabel}
        </p>
      </div>

      {/* Total sales */}
      <div className="card p-5">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          Total sales
        </p>
        <p
          className="text-2xl font-bold leading-none mb-1"
          style={{ color: "var(--color-ink-primary)" }}
        >
          {salesCount}
        </p>
        <p className="text-xs" style={{ color: "var(--color-ink-tertiary)" }}>
          {salesCount === 1 ? "transaction" : "transactions"}
        </p>
      </div>
    </section>
  );
}

// ─── Collect Payment Banner ───────────────────────────────────────────────────

function CollectBanner({ customer, onCollect }: CollectBannerProps) {
  return (
    <div className="card p-5 mb-6 flex items-center justify-between gap-4">
      <div>
        <p
          className="font-medium text-sm"
          style={{ color: "var(--color-ink-primary)" }}
        >
          Collect payment
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-danger)" }}>
          Owes {formatCurrency(-customer.balance)}
        </p>
      </div>
      <button
        type="button"
        onClick={onCollect}
        className="btn btn-sm flex-shrink-0"
        style={{ background: "var(--color-danger)", color: "#fff" }}
      >
        Collect
      </button>
    </div>
  );
}

// ─── Sales History ────────────────────────────────────────────────────────────

function SalesHistory({ sales }: SalesHistoryProps) {
  return (
    <section
      aria-label="Sales history"
      className="card mb-6 overflow-hidden animate-fade-in-up"
    >
      <div
        className="px-5 py-4"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <h2
          className="font-semibold text-sm"
          style={{ color: "var(--color-ink-primary)" }}
        >
          Sales history
        </h2>
      </div>

      {sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 px-5">
          {/* Receipt icon */}
          <svg
            width="40"
            height="40"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{ color: "var(--color-ink-ghost, #cbd5e1)" }}
          >
            <path
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p
            className="text-sm text-center"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            No sales recorded yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-auto-shop" style={{ minWidth: 420 }}>
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
        </div>
      )}
    </section>
  );
}

// ─── Payment History ──────────────────────────────────────────────────────────

function PaymentHistory({ payments }: PaymentHistoryProps) {
  return (
    <section
      aria-label="Payment history"
      className="card overflow-hidden animate-fade-in-up"
      style={{ animationDelay: "80ms" }}
    >
      <div
        className="px-5 py-4"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <h2
          className="font-semibold text-sm"
          style={{ color: "var(--color-ink-primary)" }}
        >
          Payment history
        </h2>
      </div>

      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 px-5">
          {/* Credit card icon */}
          <svg
            width="40"
            height="40"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{ color: "var(--color-ink-ghost, #cbd5e1)" }}
          >
            <rect
              x="2"
              y="5"
              width="20"
              height="14"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M6 15h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <p
            className="text-sm text-center"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            No payments recorded yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
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
                    style={{ fontSize: 12, color: "var(--color-ink-tertiary)" }}
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
        </div>
      )}
    </section>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CustomerSkeleton() {
  return (
    <div className="w-full">
      <div
        className="h-8 w-32 rounded-lg animate-pulse-soft mb-6"
        style={{ background: "var(--color-surface-2)" }}
      />
      <div className="card p-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-5 rounded-lg animate-pulse-soft"
            style={{
              background: "var(--color-surface-2)",
              width: i === 0 ? "40%" : "70%",
            }}
          />
        ))}
      </div>
    </div>
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
  const [collectOpen, setCollectOpen] = useState(false);

  async function handleDelete() {
    if (!shopId) return;
    await deleteCustomer({ shopId, customerId: id });
    router.replace("/customers");
  }

  if (isLoading) return <CustomerSkeleton />;

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-48">
        <p style={{ color: "var(--color-ink-tertiary)" }}>Customer not found</p>
      </div>
    );
  }

  const isInDebt = customer.balance < 0;

  return (
    <div className="w-full">
      {/* Delete confirmation modal */}
      {confirmingDelete && (
        <DeleteDialog
          customerName={customer.name}
          isPending={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}

      {/* Collect debt modal */}
      {collectOpen && shopId && user && (
        <CollectDebtModal
          customer={customer}
          shopId={shopId}
          userId={user.id}
          onClose={() => setCollectOpen(false)}
        />
      )}

      {/* Back link */}
      <Link
        href="/customers"
        className="btn btn-ghost btn-sm mb-6"
        style={{ color: "var(--color-ink-tertiary)" }}
      >
        <svg
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
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

      {/* Header: avatar + name + actions */}
      <CustomerHeader
        customer={customer}
        editing={editing}
        onEdit={() => setEditing(true)}
        onDelete={() => setConfirmingDelete(true)}
      />

      {/* Metric cards */}
      {!editing && (
        <MetricCards customer={customer} salesCount={sales.length} />
      )}

      {/* Edit form */}
      {editing && (
        <div className="card p-5 mb-6 animate-fade-in">
          <h2
            className="font-semibold text-sm mb-4"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Edit customer
          </h2>
          <EditCustomerForm
            shopId={shopId ?? ""}
            customerId={customer.id}
            initialName={customer.name}
            initialPhone={customer.phone}
            onSaved={() => setEditing(false)}
          />
        </div>
      )}

      {/* Collect payment banner */}
      {!editing && isInDebt && shopId && user && (
        <CollectBanner
          customer={customer}
          onCollect={() => setCollectOpen(true)}
        />
      )}

      {/* History sections */}
      {!editing && (
        <>
          <SalesHistory sales={sales} />
          <PaymentHistory payments={payments} />
        </>
      )}
    </div>
  );
}
