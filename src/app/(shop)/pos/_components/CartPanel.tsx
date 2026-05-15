"use client";

import type { ComponentProps } from "react";
import { CartRow } from "@/components/pos/CartRow";
import { CustomerSelector } from "@/components/pos/CustomerSelector";
import { formatCurrency } from "@/lib/utils";
import type { PaymentMethod } from "@/types/app";
import { CartItemList } from "./CartItemList";
import { DeliverySection } from "./DeliverySection";
import { CartSummary } from "./CartSummary";
import { PaymentMethodPicker } from "./PaymentMethodPicker";
import { PartialPaymentInput } from "./PartialPaymentInput";

type CartItem = ComponentProps<typeof CartRow>["item"];
type CustomerSelectorProps = ComponentProps<typeof CustomerSelector>;

interface Props {
  items: CartItem[];
  total: number;
  grandTotal: number;
  onClear: () => void;
  onQtyChange: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onPriceEdit: (productId: string, price: number, reason: string) => void;
  deliveryEnabled: boolean;
  deliveryAddress: string;
  deliveryFee: number;
  addressError: boolean;
  onDeliveryToggle: () => void;
  onDeliveryAddressChange: (v: string) => void;
  onDeliveryFeeChange: (v: number) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  customers: CustomerSelectorProps["customers"];
  selectedCustomer: CustomerSelectorProps["selectedCustomer"];
  customerSearch: string;
  customerError: boolean;
  isCreatingCustomer: boolean;
  onCustomerSearchChange: (v: string) => void;
  onCustomerSelect: CustomerSelectorProps["onSelect"];
  onCustomerClear: () => void;
  onCreateAndSelect: (name: string) => void;
  amountPaid: number;
  amountPaidError: boolean;
  onAmountPaidChange: (v: number) => void;
  isSaving: boolean;
  onCheckout: () => void;
}

export function CartPanel({
  items,
  total,
  grandTotal,
  onClear,
  onQtyChange,
  onRemove,
  onPriceEdit,
  deliveryEnabled,
  deliveryAddress,
  deliveryFee,
  addressError,
  onDeliveryToggle,
  onDeliveryAddressChange,
  onDeliveryFeeChange,
  paymentMethod,
  onPaymentMethodChange,
  customers,
  selectedCustomer,
  customerSearch,
  customerError,
  isCreatingCustomer,
  onCustomerSearchChange,
  onCustomerSelect,
  onCustomerClear,
  onCreateAndSelect,
  amountPaid,
  amountPaidError,
  onAmountPaidChange,
  isSaving,
  onCheckout,
}: Props) {
  return (
    <div className="hidden sm:flex sm:w-80 flex-col card p-0 overflow-hidden flex-shrink-0">
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
            onClick={onClear}
            className="text-xs"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <CartItemList
          items={items}
          onQtyChange={onQtyChange}
          onRemove={onRemove}
          onPriceEdit={onPriceEdit}
        />
      </div>

      {items.length > 0 && (
        <div
          className="p-4"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <DeliverySection
            enabled={deliveryEnabled}
            address={deliveryAddress}
            fee={deliveryFee}
            addressError={addressError}
            onToggle={onDeliveryToggle}
            onAddressChange={onDeliveryAddressChange}
            onFeeChange={onDeliveryFeeChange}
          />
          <CartSummary
            subtotal={total}
            deliveryFee={deliveryFee}
            grandTotal={grandTotal}
            showBreakdown={deliveryEnabled && deliveryFee > 0}
          />
          <PaymentMethodPicker
            value={paymentMethod}
            onChange={onPaymentMethodChange}
          />

          {(paymentMethod === "credit" || paymentMethod === "partial") && (
            <div className="mb-3">
              <CustomerSelector
                customers={customers}
                selectedCustomer={selectedCustomer}
                search={customerSearch}
                onSearchChange={onCustomerSearchChange}
                onSelect={onCustomerSelect}
                onClear={onCustomerClear}
                onCreateAndSelect={onCreateAndSelect}
                isCreating={isCreatingCustomer}
                error={customerError}
              />
            </div>
          )}

          {paymentMethod === "partial" && (
            <PartialPaymentInput
              amountPaid={amountPaid}
              grandTotal={grandTotal}
              error={amountPaidError}
              onChange={onAmountPaidChange}
            />
          )}

          <button
            onClick={onCheckout}
            disabled={isSaving}
            className="btn btn-primary w-full"
          >
            {isSaving ? "Processing…" : `Charge ${formatCurrency(grandTotal)}`}
          </button>
        </div>
      )}
    </div>
  );
}
