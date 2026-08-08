"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useCustomers } from "@/hooks/useCustomers";
import { SearchBar } from "@/components/ui/SearchBar";
import { CollectDebtModal } from "@/components/customers/CollectDebtModal";
import { CustomerStatsBar } from "./_components/CustomerStatsBar";
import { CustomerList } from "./_components/CustomerList";
import type { Customer } from "@/types/app";

export default function CustomersPage() {
  const shopId = useAuthStore(selectShopId);
  const user = useAuthStore((s) => s.user);
  const { data: customers = [], isLoading, isError } = useCustomers(shopId);
  const [search, setSearch] = useState("");
  const [collectTarget, setCollectTarget] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)),
    );
  }, [customers, search]);

  const totalDebt = useMemo(
    () =>
      customers.reduce((sum, c) => sum + (c.balance < 0 ? -c.balance : 0), 0),
    [customers],
  );

  const inDebtCount = customers.filter((c) => c.balance < 0).length;

  return (
    <div>
      {collectTarget && shopId && user && (
        <CollectDebtModal
          customer={collectTarget}
          shopId={shopId}
          userId={user.id}
          onClose={() => setCollectTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Customers
          </h1>
          <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
            {customers.length} total
            {inDebtCount > 0 && (
              <span style={{ color: "var(--color-danger)" }}>
                {" "}
                · {inDebtCount} in debt
              </span>
            )}
          </p>
        </div>
        <Link
          href="/customers/new"
          className="btn btn-primary btn-sm self-start"
        >
          + Add customer
        </Link>
      </div>

      {inDebtCount > 0 && (
        <CustomerStatsBar totalDebt={totalDebt} inDebtCount={inDebtCount} />
      )}

      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name or phone…"
        />
      </div>

      <CustomerList
        customers={filtered}
        isLoading={isLoading}
        isError={isError}
        search={search}
        onCollect={setCollectTarget}
      />
    </div>
  );
}
