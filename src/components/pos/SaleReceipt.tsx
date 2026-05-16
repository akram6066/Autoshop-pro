"use client";

import { formatCurrency } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/types/app";

export interface ReceiptData {
  saleId: string;
  total: number;
  paymentMethod: PaymentMethod;
  deliveryAddress?: string;
  deliveryFee?: number;
  customerName?: string;
  amountPaid?: number;
}

export function SaleReceipt({
  receipt,
  onDismiss,
}: {
  receipt: ReceiptData;
  onDismiss: () => void;
}) {
  const debt =
    receipt.amountPaid !== undefined ? receipt.total - receipt.amountPaid : 0;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="card p-8 text-center max-w-sm w-full animate-scale-in">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
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
        <h2 className="text-xl font-medium mb-1">Sale complete</h2>
        <p
          className="text-3xl font-semibold mt-3 mb-1"
          style={{ color: "var(--color-brand-600)" }}
        >
          {formatCurrency(receipt.total)}
        </p>
        <p
          className="text-xs mt-1"
          style={{
            color: "var(--color-ink-tertiary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          #{receipt.saleId.slice(0, 8).toUpperCase()}
        </p>
        <div className="mt-1 mb-6 flex flex-col gap-0.5">
          <p className="text-xs" style={{ color: "var(--color-ink-tertiary)" }}>
            via {PAYMENT_METHOD_LABELS[receipt.paymentMethod]}
          </p>
          {receipt.deliveryAddress && (
            <p
              className="text-xs"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Delivery → {receipt.deliveryAddress}
            </p>
          )}
          {receipt.customerName && receipt.paymentMethod === "credit" && (
            <p
              className="text-xs"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Full credit to {receipt.customerName}
            </p>
          )}
          {receipt.customerName &&
            receipt.paymentMethod === "partial" &&
            receipt.amountPaid !== undefined && (
              <>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-ink-tertiary)" }}
                >
                  Paid: {formatCurrency(receipt.amountPaid)}
                </p>
                {debt > 0 && (
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-danger)" }}
                  >
                    Debt: {formatCurrency(debt)} → {receipt.customerName}
                  </p>
                )}
              </>
            )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="btn btn-primary w-full"
        >
          New sale
        </button>
      </div>
    </div>
  );
}
