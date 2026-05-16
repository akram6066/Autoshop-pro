"use client";

import { useReducer, useMemo } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useRecordSale } from "@/hooks/useSales";
import { useCustomers, useCreateCustomer } from "@/hooks/useCustomers";
import { useCart } from "@/hooks/useCart";
import type { ReceiptData } from "@/components/pos/SaleReceipt";
import type { Customer, PaymentMethod } from "@/types/app";
import { ProductGrid } from "./_components/ProductGrid";
import { CartPanel } from "./_components/CartPanel";
import { MobileCartBar } from "./_components/MobileCartBar";

// SaleReceipt is only shown after checkout — no reason to include it in the
// initial bundle. ssr:false because it reads no server data.
const SaleReceipt = dynamic(
  () =>
    import("@/components/pos/SaleReceipt").then((m) => ({
      default: m.SaleReceipt,
    })),
  { ssr: false },
);

// ─── Checkout state ───────────────────────────────────────────────────────────

interface CheckoutState {
  paymentMethod: PaymentMethod;
  deliveryEnabled: boolean;
  deliveryAddress: string;
  deliveryFee: number;
  customerId: string | null;
  customerSearch: string;
  amountPaid: number;
  // validation errors
  addressError: boolean;
  customerError: boolean;
  amountPaidError: boolean;
  // post-sale
  receipt: ReceiptData | null;
}

type CheckoutAction =
  | { type: "SET_PAYMENT_METHOD"; method: PaymentMethod }
  | { type: "TOGGLE_DELIVERY" }
  | { type: "SET_DELIVERY_ADDRESS"; value: string }
  | { type: "SET_DELIVERY_FEE"; value: number }
  | { type: "SELECT_CUSTOMER"; id: string }
  | { type: "SET_CUSTOMER_SEARCH"; value: string }
  | { type: "CLEAR_CUSTOMER" }
  | { type: "SET_AMOUNT_PAID"; value: number }
  | {
      type: "SET_ERRORS";
      errors: Partial<
        Pick<
          CheckoutState,
          "addressError" | "customerError" | "amountPaidError"
        >
      >;
    }
  | { type: "SET_RECEIPT"; receipt: ReceiptData }
  | { type: "RESET_AFTER_SALE" };

const initial: CheckoutState = {
  paymentMethod: "cash",
  deliveryEnabled: false,
  deliveryAddress: "",
  deliveryFee: 0,
  customerId: null,
  customerSearch: "",
  amountPaid: 0,
  addressError: false,
  customerError: false,
  amountPaidError: false,
  receipt: null,
};

function checkoutReducer(
  state: CheckoutState,
  action: CheckoutAction,
): CheckoutState {
  switch (action.type) {
    case "SET_PAYMENT_METHOD": {
      const base = {
        ...state,
        paymentMethod: action.method,
        customerError: false,
        amountPaidError: false,
      };
      if (action.method === "cash" || action.method === "mpesa") {
        return { ...base, customerId: null, customerSearch: "", amountPaid: 0 };
      }
      if (action.method === "credit") {
        return { ...base, amountPaid: 0 };
      }
      return base;
    }
    case "TOGGLE_DELIVERY":
      return {
        ...state,
        deliveryEnabled: !state.deliveryEnabled,
        addressError: false,
      };
    case "SET_DELIVERY_ADDRESS":
      return { ...state, deliveryAddress: action.value, addressError: false };
    case "SET_DELIVERY_FEE":
      return { ...state, deliveryFee: action.value };
    case "SELECT_CUSTOMER":
      return {
        ...state,
        customerId: action.id,
        customerSearch: "",
        customerError: false,
      };
    case "SET_CUSTOMER_SEARCH":
      return { ...state, customerSearch: action.value, customerError: false };
    case "CLEAR_CUSTOMER":
      return { ...state, customerId: null, customerSearch: "", amountPaid: 0 };
    case "SET_AMOUNT_PAID":
      return { ...state, amountPaid: action.value, amountPaidError: false };
    case "SET_ERRORS":
      return { ...state, ...action.errors };
    case "SET_RECEIPT":
      return { ...state, receipt: action.receipt };
    case "RESET_AFTER_SALE":
      return initial;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  const [state, dispatch] = useReducer(checkoutReducer, initial);
  const {
    paymentMethod,
    deliveryEnabled,
    deliveryAddress,
    deliveryFee,
    customerId,
    customerSearch,
    amountPaid,
    addressError,
    customerError,
    amountPaidError,
    receipt,
  } = state;

  const grandTotal = total + (deliveryEnabled ? deliveryFee : 0);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId) ?? null,
    [customers, customerId],
  );

  async function handleCreateAndSelect(name: string) {
    if (!shopId || !name.trim()) return;
    try {
      const c = await createCustomer({ shopId, name: name.trim() });
      dispatch({ type: "SELECT_CUSTOMER", id: c.id });
    } catch {
      toast.error("Could not create customer");
    }
  }

  async function handleCheckout() {
    if (!shopId || !user || items.length === 0) return;

    if (deliveryEnabled && !deliveryAddress.trim()) {
      dispatch({ type: "SET_ERRORS", errors: { addressError: true } });
      return;
    }
    if (
      (paymentMethod === "credit" || paymentMethod === "partial") &&
      !customerId
    ) {
      dispatch({ type: "SET_ERRORS", errors: { customerError: true } });
      return;
    }
    if (
      paymentMethod === "partial" &&
      (amountPaid <= 0 || amountPaid > grandTotal)
    ) {
      dispatch({ type: "SET_ERRORS", errors: { amountPaidError: true } });
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
      dispatch({
        type: "SET_RECEIPT",
        receipt: {
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
        },
      });
      clear();
    } catch {
      toast.error("Sale failed — please try again.");
    }
  }

  function handleDismissReceipt() {
    dispatch({ type: "RESET_AFTER_SALE" });
  }

  if (receipt) {
    return <SaleReceipt receipt={receipt} onDismiss={handleDismissReceipt} />;
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
          onDeliveryToggle={() => dispatch({ type: "TOGGLE_DELIVERY" })}
          onDeliveryAddressChange={(v) =>
            dispatch({ type: "SET_DELIVERY_ADDRESS", value: v })
          }
          onDeliveryFeeChange={(v) =>
            dispatch({ type: "SET_DELIVERY_FEE", value: v })
          }
          paymentMethod={paymentMethod}
          onPaymentMethodChange={(m) =>
            dispatch({ type: "SET_PAYMENT_METHOD", method: m })
          }
          customers={customers}
          selectedCustomer={selectedCustomer}
          customerSearch={customerSearch}
          customerError={customerError}
          isCreatingCustomer={isCreatingCustomer}
          onCustomerSearchChange={(v) =>
            dispatch({ type: "SET_CUSTOMER_SEARCH", value: v })
          }
          onCustomerSelect={(c: Customer) =>
            dispatch({ type: "SELECT_CUSTOMER", id: c.id })
          }
          onCustomerClear={() => dispatch({ type: "CLEAR_CUSTOMER" })}
          onCreateAndSelect={handleCreateAndSelect}
          amountPaid={amountPaid}
          amountPaidError={amountPaidError}
          onAmountPaidChange={(v) =>
            dispatch({ type: "SET_AMOUNT_PAID", value: v })
          }
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
