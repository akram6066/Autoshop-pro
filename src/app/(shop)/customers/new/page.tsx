"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useCreateCustomer } from "@/hooks/useCustomers";

export default function NewCustomerPage() {
  const router = useRouter();
  const shopId = useAuthStore(selectShopId);
  const { mutateAsync: createCustomer, isPending } = useCreateCustomer();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId || !name.trim()) return;
    setError("");
    try {
      const customer = await createCustomer({
        shopId,
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      router.push(`/customers/${customer.id}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to create customer",
      );
    }
  }

  return (
    <div className="max-w-md">
      <button
        onClick={() => router.back()}
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
        Back to customers
      </button>

      <h1
        className="text-2xl font-semibold mb-6"
        style={{ color: "var(--color-ink-primary)" }}
      >
        Add customer
      </h1>

      <div className="card p-6 animate-scale-in">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Full name <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              placeholder="e.g. John Mwangi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Phone{" "}
              <span
                style={{ color: "var(--color-ink-ghost)", fontWeight: 400 }}
              >
                (optional)
              </span>
            </label>
            <input
              className="input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0712 345 678"
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--color-danger)" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending || !name.trim()}
            >
              {isPending ? "Saving…" : "Save customer"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
