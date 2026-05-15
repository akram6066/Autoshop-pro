"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useRecordSale } from "@/hooks/useSales";
import { useCustomers, useCreateCustomer } from "@/hooks/useCustomers";
import { useCart } from "@/hooks/useCart";
import { SaleReceipt, type ReceiptData } from "@/components/pos/SaleReceipt";
import type { PaymentMethod } from "@/types/app";
import { ProductGrid } from "./_components/ProductGrid";
import { CartPanel } from "./_components/CartPanel";
import { MobileCartBar } from "./_components/MobileCartBar";

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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [addressError, setAddressError] = useState(false);
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
  }

  if (receipt) {
    return <SaleReceipt receipt={receipt} onDismiss={() => setReceipt(null)} />;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-6 sm:h-[calc(100vh-7rem)]">
        <ProductGrid
          products={products}
          isLoading={isLoading}
          categories={categories}
          onAdd={add}
        />
        <CartPanel
          items={items}
          total={total}
          grandTotal={grandTotal}
          onClear={clear}
          onQtyChange={updateQty}
          onRemove={remove}
          onPriceEdit={overridePrice}
          deliveryEnabled={deliveryEnabled}
          deliveryAddress={deliveryAddress}
          deliveryFee={deliveryFee}
          addressError={addressError}
          onDeliveryToggle={() => {
            setDeliveryEnabled((v) => !v);
            setAddressError(false);
          }}
          onDeliveryAddressChange={(v) => {
            setDeliveryAddress(v);
            if (addressError) setAddressError(false);
          }}
          onDeliveryFeeChange={setDeliveryFee}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={handlePaymentMethodChange}
          customers={customers}
          selectedCustomer={selectedCustomer}
          customerSearch={customerSearch}
          customerError={customerError}
          isCreatingCustomer={isCreatingCustomer}
          onCustomerSearchChange={(v) => {
            setCustomerSearch(v);
            setCustomerError(false);
          }}
          onCustomerSelect={(c) => {
            setCustomerId(c.id);
            setCustomerSearch("");
            setCustomerError(false);
          }}
          onCustomerClear={() => {
            setCustomerId(null);
            setCustomerSearch("");
            setAmountPaid(0);
          }}
          onCreateAndSelect={handleCreateAndSelect}
          amountPaid={amountPaid}
          amountPaidError={amountPaidError}
          onAmountPaidChange={(v) => {
            setAmountPaid(v);
            setAmountPaidError(false);
          }}
          isSaving={isSaving}
          onCheckout={handleCheckout}
        />
      </div>
      <MobileCartBar
        itemCount={items.length}
        grandTotal={grandTotal}
        isSaving={isSaving}
        onCheckout={handleCheckout}
      />
    </>
  );
}
