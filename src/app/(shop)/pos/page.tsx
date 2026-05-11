"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useRecordSale } from "@/hooks/useSales";
import { useCustomers, useCreateCustomer } from "@/hooks/useCustomers";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";
import { SearchBar } from "@/components/ui/SearchBar";
import { ProductCard } from "@/components/pos/ProductCard";
import { CartRow } from "@/components/pos/CartRow";
import { CustomerSelector } from "@/components/pos/CustomerSelector";
import { SaleReceipt, type ReceiptData } from "@/components/pos/SaleReceipt";
import type { PaymentMethod } from "@/types/app";
import { PAYMENT_METHOD_LABELS } from "@/types/app";

export default function POSPage() {
  const shopId = useAuthStore(selectShopId);
  const user = useAuthStore((s) => s.user);
  const { data: products = [], isLoading } = useProducts(shopId);
  const { data: categories = [] } = useCategories();
  const { data: customers = [] } = useCustomers(shopId);
  const { mutateAsync: recordSale, isPending: isSaving } = useRecordSale();
  const { mutateAsync: createCustomer, isPending: isCreatingCustomer } =
    useCreateCustomer();
  const { items, total, add, remove, updateQty, overridePrice, clear } =
    useCart();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  // Delivery
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [addressError, setAddressError] = useState(false);

  // Customer (credit / partial)
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerError, setCustomerError] = useState(false);
  const [amountPaid, setAmountPaid] = useState(0);
  const [amountPaidError, setAmountPaidError] = useState(false);

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const grandTotal = total + (deliveryEnabled ? deliveryFee : 0);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId) ?? null,
    [customers, customerId],
  );

  // ─── Filter ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchCat =
        categoryFilter === "all" || p.category === categoryFilter;
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [products, search, categoryFilter]);

  // ─── Payment method change ────────────────────────────────────────────────

  function handlePaymentMethodChange(m: PaymentMethod) {
    setPaymentMethod(m);
    setCustomerError(false);
    setAmountPaidError(false);
    if (m === "cash" || m === "mpesa") {
      setCustomerId(null);
      setCustomerSearch("");
      setAmountPaid(0);
    } else if (m === "credit") {
      setAmountPaid(0);
    }
  }

  // ─── Create customer inline ───────────────────────────────────────────────

  async function handleCreateAndSelect(name: string) {
    if (!shopId || !name.trim()) return;
    try {
      const c = await createCustomer({ shopId, name: name.trim() });
      setCustomerId(c.id);
      setCustomerSearch("");
      setCustomerError(false);
    } catch {
      toast.error("Could not create customer");
    }
  }

  // ─── Checkout ─────────────────────────────────────────────────────────────

  async function handleCheckout() {
    if (!shopId || !user || items.length === 0) return;

    if (deliveryEnabled && !deliveryAddress.trim()) {
      setAddressError(true);
      return;
    }
    if (
      (paymentMethod === "credit" || paymentMethod === "partial") &&
      !customerId
    ) {
      setCustomerError(true);
      return;
    }
    if (
      paymentMethod === "partial" &&
      (amountPaid <= 0 || amountPaid > grandTotal)
    ) {
      setAmountPaidError(true);
      return;
    }

    (async () => {
      try {
        const result = await recordSale({
          shopId,
          userId: user.id,
          items,
          paymentMethod,
          customerId: customerId ?? undefined,
          amountPaid: paymentMethod === "partial" ? amountPaid : undefined,
          deliveryAddress: deliveryEnabled ? deliveryAddress.trim() : undefined,
          deliveryFee: deliveryEnabled ? deliveryFee : undefined,
        });
        setReceipt({
          ...result,
          paymentMethod,
          deliveryAddress: deliveryEnabled ? deliveryAddress.trim() : undefined,
          deliveryFee:
            deliveryEnabled && deliveryFee > 0 ? deliveryFee : undefined,
          customerName: selectedCustomer?.name,
          amountPaid:
            paymentMethod === "credit"
              ? 0
              : paymentMethod === "partial"
                ? amountPaid
                : undefined,
        });
        clear();
        setDeliveryEnabled(false);
        setDeliveryAddress("");
        setDeliveryFee(0);
        setAddressError(false);
        setCustomerId(null);
        setCustomerSearch("");
        setAmountPaid(0);
        setCustomerError(false);
        setAmountPaidError(false);
      } catch {
        toast.error("Sale failed — please try again.");
      }
    })();
  }

  // ─── Receipt Modal ────────────────────────────────────────────────────────

  if (receipt) {
    return <SaleReceipt receipt={receipt} onDismiss={() => setReceipt(null)} />;
  }

  // ─── Main POS Layout ──────────────────────────────────────────────────────

  return (
    <div className="flex flex-col sm:flex-row gap-6 h-[calc(100vh-7rem)]">
      {/* ── Left: Product grid ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex gap-3 mb-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search products..."
            className="flex-1"
            autoFocus
          />
          <div className="flex flex-wrap gap-1">
            {["all", ...categories.map((c) => c.name)].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className="btn btn-sm"
                style={{
                  background:
                    categoryFilter === cat
                      ? "var(--color-brand-500)"
                      : "var(--color-surface-0)",
                  color:
                    categoryFilter === cat
                      ? "white"
                      : "var(--color-ink-secondary)",
                  border: `1px solid ${categoryFilter === cat ? "var(--color-brand-600)" : "var(--color-border-input)"}`,
                }}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl animate-pulse-soft"
                  style={{ background: "var(--color-surface-2)" }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-6">
              <p
                className="text-sm"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                No products match your search
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 stagger">
              {filtered.map((product) => (
                <div key={product.id} className="animate-fade-in-up h-full">
                  <ProductCard product={product} onAdd={() => add(product)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Cart ── */}
      <div className="sm:w-80 w-full flex flex-col card p-0 overflow-hidden flex-shrink-0">
        {/* Cart header */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <h2
            className="font-medium"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Cart
            {items.length > 0 && (
              <span
                className="ml-2 text-sm font-normal"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
            )}
          </h2>
          {items.length > 0 && (
            <button
              onClick={clear}
              className="text-xs"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-6">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ background: "var(--color-surface-2)" }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
                    stroke="var(--color-ink-ghost)"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p
                className="text-sm"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                Tap a product to add it
              </p>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <CartRow
                  key={item.product.id}
                  item={item}
                  onQtyChange={(qty) => updateQty(item.product.id, qty)}
                  onRemove={() => remove(item.product.id)}
                  onPriceEdit={(price, reason) =>
                    overridePrice(item.product.id, price, reason)
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Totals + Checkout */}
        {items.length > 0 && (
          <div
            className="p-4"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            {/* Delivery toggle */}
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <span
                  className="text-sm"
                  style={{ color: "var(--color-ink-secondary)" }}
                >
                  Delivery
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={deliveryEnabled}
                  onClick={() => {
                    setDeliveryEnabled((v) => !v);
                    setAddressError(false);
                  }}
                  className="relative inline-flex h-5 w-10 items-center rounded-full transition-colors"
                  style={{
                    background: deliveryEnabled
                      ? "var(--color-brand-500)"
                      : "var(--color-surface-2)",
                    border: `1px solid ${deliveryEnabled ? "var(--color-brand-600)" : "var(--color-border-input)"}`,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full transition-transform"
                    style={{
                      background: "white",
                      transform: deliveryEnabled
                        ? "translateX(22px)"
                        : "translateX(2px)",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                    }}
                  />
                </button>
              </div>
              {deliveryEnabled && (
                <div className="mt-2 flex flex-col gap-2">
                  <div>
                    <input
                      type="text"
                      placeholder="Delivery address"
                      value={deliveryAddress}
                      onChange={(e) => {
                        setDeliveryAddress(e.target.value);
                        if (addressError) setAddressError(false);
                      }}
                      className="input w-full text-sm"
                      style={
                        addressError
                          ? { borderColor: "var(--color-danger)" }
                          : undefined
                      }
                    />
                    {addressError && (
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--color-danger)" }}
                      >
                        Address is required for delivery
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-ink-tertiary)" }}
                    >
                      Delivery fee
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      placeholder="0"
                      value={deliveryFee || ""}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setDeliveryFee(isNaN(v) || v < 0 ? 0 : Math.round(v));
                      }}
                      className="input text-sm text-right"
                      style={{ width: "7rem" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Subtotal breakdown */}
            {deliveryEnabled && deliveryFee > 0 && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-ink-tertiary)" }}
                  >
                    Subtotal
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-ink-secondary)" }}
                  >
                    {formatCurrency(total)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-ink-tertiary)" }}
                  >
                    Delivery
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-ink-secondary)" }}
                  >
                    {formatCurrency(deliveryFee)}
                  </span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between mb-3">
              <span
                className="text-sm"
                style={{ color: "var(--color-ink-secondary)" }}
              >
                Total
              </span>
              <span
                className="text-2xl font-semibold"
                style={{ color: "var(--color-ink-primary)" }}
              >
                {formatCurrency(grandTotal)}
              </span>
            </div>

            {/* Payment method */}
            <div className="flex gap-1.5 mb-3">
              {(["cash", "mpesa", "credit", "partial"] as PaymentMethod[]).map(
                (m) => (
                  <button
                    key={m}
                    onClick={() => handlePaymentMethodChange(m)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background:
                        paymentMethod === m
                          ? "var(--color-brand-500)"
                          : "var(--color-surface-2)",
                      color:
                        paymentMethod === m
                          ? "white"
                          : "var(--color-ink-secondary)",
                      border: `1px solid ${paymentMethod === m ? "var(--color-brand-600)" : "oklch(88% 0 0)"}`,
                    }}
                  >
                    {PAYMENT_METHOD_LABELS[m]}
                  </button>
                ),
              )}
            </div>

            {/* Customer selector (credit / partial) */}
            {(paymentMethod === "credit" || paymentMethod === "partial") && (
              <div className="mb-3">
                <CustomerSelector
                  customers={customers}
                  selectedCustomer={selectedCustomer}
                  search={customerSearch}
                  onSearchChange={(v) => {
                    setCustomerSearch(v);
                    setCustomerError(false);
                  }}
                  onSelect={(c) => {
                    setCustomerId(c.id);
                    setCustomerSearch("");
                    setCustomerError(false);
                  }}
                  onClear={() => {
                    setCustomerId(null);
                    setCustomerSearch("");
                    setAmountPaid(0);
                  }}
                  onCreateAndSelect={handleCreateAndSelect}
                  isCreating={isCreatingCustomer}
                  error={customerError}
                />
              </div>
            )}

            {/* Amount paid (partial only) */}
            {paymentMethod === "partial" && (
              <div className="mb-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-ink-tertiary)" }}
                  >
                    Amount paid now
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="50"
                    placeholder="0"
                    value={amountPaid || ""}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setAmountPaid(isNaN(v) || v < 0 ? 0 : Math.round(v));
                      setAmountPaidError(false);
                    }}
                    className="input text-sm text-right"
                    style={{
                      width: "7rem",
                      borderColor: amountPaidError
                        ? "var(--color-danger)"
                        : undefined,
                    }}
                  />
                </div>
                {amountPaidError && (
                  <p
                    className="text-xs mt-1 text-right"
                    style={{ color: "var(--color-danger)" }}
                  >
                    Enter amount between 1 and {formatCurrency(grandTotal)}
                  </p>
                )}
                {amountPaid > 0 && amountPaid < grandTotal && (
                  <p
                    className="text-xs mt-1 text-right"
                    style={{ color: "var(--color-warning)" }}
                  >
                    Debt: {formatCurrency(grandTotal - amountPaid)}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={isSaving}
              className="btn btn-primary w-full"
            >
              {isSaving
                ? "Processing…"
                : `Charge ${formatCurrency(grandTotal)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
