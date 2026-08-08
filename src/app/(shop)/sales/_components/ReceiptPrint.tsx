import { formatCurrency, formatDate } from "@/lib/utils";
import type { SaleSummary } from "./SaleDetailModal";
import type { Shop } from "@/types/app";

interface SaleItem {
  id: string;
  quantity: number;
  unit_price: number;
  original_price: number | null;
  override_reason: string | null;
  products: { name: string; sku: string | null } | null;
}

interface ReceiptPrintProps {
  sale: SaleSummary;
  items: SaleItem[];
  shop: Shop | null;
  taxRate: number; // 0 to 1 (e.g. 0.16)
}

export function ReceiptPrint({
  sale,
  items,
  shop,
  taxRate,
}: ReceiptPrintProps) {
  // Financial math
  const total = sale.total_amount;

  return (
    <div
      id="printable-receipt"
      className="px-4 py-6 bg-white text-black text-sm"
      style={{
        fontFamily: "monospace",
        width: "100%",
        maxWidth: "80mm",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold uppercase tracking-wider mb-1">
          {shop?.name ?? "AutoShop"}
        </h1>
        {shop?.address && (
          <p className="text-xs whitespace-pre-wrap">{shop.address}</p>
        )}
      </div>

      {/* Meta */}
      <div className="mb-4 text-xs">
        {/* Date & Invoice Number */}
        <div className="flex justify-between items-center text-xs mb-4">
          <span>{formatDate(sale.created_at).split(",")[0]}</span>
          <span>
            {sale.invoice_number || `#${sale.id.slice(0, 8).toUpperCase()}`}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span>{sale.staff_name || "Staff"}</span>
        </div>
        <div className="flex justify-between">
          <span>Payment:</span>
          <span className="capitalize">{sale.payment_method}</span>
        </div>
        {sale.delivery_address && (
          <div className="mt-2 border-t border-dashed border-gray-400 pt-1">
            <span>Delivery:</span>
            <p className="whitespace-pre-wrap">{sale.delivery_address}</p>
          </div>
        )}
      </div>

      <div className="border-t-2 border-dashed border-black my-2"></div>

      {/* Items */}
      <div className="mb-4 text-xs">
        <div className="flex justify-between font-bold border-b border-black pb-1 mb-2">
          <span className="w-8">Qty</span>
          <span className="flex-1">Item</span>
          <span className="text-right w-16">Total</span>
        </div>
        {items.map((item) => (
          <div key={item.id} className="mb-2">
            <div className="flex justify-between items-start">
              <span className="w-8">{item.quantity}</span>
              <span className="flex-1 pr-2 leading-tight break-words">
                {item.products?.name ?? "Unknown"}
              </span>
              <span className="text-right w-16 whitespace-nowrap">
                {formatCurrency(item.quantity * item.unit_price)}
              </span>
            </div>
            {item.quantity > 1 && (
              <div className="text-[10px] text-gray-600 pl-8">
                {item.quantity} @ {formatCurrency(item.unit_price)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t-2 border-dashed border-black my-2"></div>

      {/* Totals */}
      <div className="mb-6 text-sm">
        <div className="flex justify-between font-bold text-base mb-2">
          <span>TOTAL</span>
          <span>{formatCurrency(total)}</span>
        </div>

        {/* Partial Payment / Credit */}
        {sale.amount_paid != null && sale.amount_paid < total && (
          <>
            <div className="border-t border-gray-300 my-2"></div>
            <div className="flex justify-between text-xs mb-1">
              <span>Amount Paid</span>
              <span>{formatCurrency(sale.amount_paid)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span>Balance Due</span>
              <span>{formatCurrency(total - sale.amount_paid)}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs mt-8">
        <p className="font-bold mb-1">Thank you for your business!</p>
        <p className="text-[10px] text-gray-500">
          Please retain this receipt for your records and returns.
        </p>
      </div>
    </div>
  );
}
