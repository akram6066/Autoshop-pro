import { formatCurrency } from "@/lib/utils";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
  type CartItem,
} from "@/types/app";
import { useAuthStore } from "@/stores/authStore";
import { ReceiptPrint } from "@/app/(shop)/sales/_components/ReceiptPrint";

export interface ReceiptData {
  saleId: string;
  total: number;
  paymentMethod: PaymentMethod;
  deliveryAddress?: string;
  deliveryFee?: number;
  customerName?: string;
  amountPaid?: number;
  invoice_number?: string;
  items: CartItem[];
}

export function SaleReceipt({
  receipt,
  onDismiss,
}: {
  receipt: ReceiptData;
  onDismiss: () => void;
}) {
  const shop = useAuthStore((s) => s.shop);
  const profile = useAuthStore((s) => s.profile);
  const taxRate = shop?.tax_rate ?? 0;
  const staffName = profile?.full_name || "Staff";
  const debt =
    receipt.amountPaid !== undefined ? receipt.total - receipt.amountPaid : 0;

  // Map CartItems to SaleItems format for the ReceiptPrint component
  const receiptItems = receipt.items.map((item, index) => ({
    id: item.cartKey || String(index),
    quantity: item.quantity,
    unit_price: item.unit_price,
    original_price: item.product?.price ?? null,
    override_reason: item.overrideReason ?? null,
    products: {
      name: item.product?.name ?? "Unknown",
      sku: item.product?.sku ?? null,
    },
  }));

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
          {receipt.invoice_number ||
            `#${receipt.saleId.slice(0, 8).toUpperCase()}`}
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
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-secondary flex-1"
          >
            Print receipt
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="btn btn-primary flex-1"
          >
            New sale
          </button>
        </div>
      </div>

      {/* Hidden Printable Receipt */}
      <ReceiptPrint
        sale={{
          id: receipt.saleId,
          invoice_number: receipt.invoice_number,
          total_amount: receipt.total,
          payment_method: receipt.paymentMethod,
          created_at: new Date().toISOString(),
          staff_name: staffName,
          amount_paid: receipt.amountPaid ?? receipt.total,
          delivery_address: receipt.deliveryAddress ?? null,
        }}
        items={receiptItems}
        shop={shop}
        taxRate={taxRate}
      />
    </div>
  );
}
