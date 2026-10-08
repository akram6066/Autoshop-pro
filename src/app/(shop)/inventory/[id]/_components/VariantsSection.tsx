"use client";
import { VariantCard } from "./VariantCard";

import { useState, useMemo, use } from "react";
import { useMounted } from "@/hooks/useMounted";
import { toast } from "sonner";
import Link from "next/link";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { productSchema } from "@/lib/validations/domain";
import { useProduct, useUpdateProduct } from "@/hooks/useProducts";
import {
  useProductVariants,
  useUpdateVariant,
  useDeleteVariant,
} from "@/hooks/useVariants";
import { useRooms } from "@/hooks/useRooms";
import { useTeam } from "@/hooks/useTeam";
import { useCategories } from "@/hooks/useCategories";
import {
  useArchiveProduct,
  useRestoreProduct,
} from "@/hooks/useInventoryMovements";
import { formatCurrency, formatDateTime, categoryLabel } from "@/lib/utils";
import type {
  Room,
  Category,
  ProductVariant,
  InventoryMovementType,
} from "@/types/app";

// ─── Edit Form ────────────────────────────────────────────────────────────────

export function VariantsSection({
  productId,
  shopId,
}: {
  productId: string;
  shopId: string | null;
}) {
  const { data: variants = [], isLoading } = useProductVariants(productId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl animate-pulse-soft"
            style={{ background: "var(--color-surface-2)" }}
          />
        ))}
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
        No sizes defined.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {variants.map((v) => (
        <VariantCard key={v.id} variant={v} shopId={shopId} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
