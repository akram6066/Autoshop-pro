"use client";

import { useProductVariants } from "@/hooks/useVariants";
import { VariantCard } from "./VariantCard";

interface VariantsSectionProps {
  productId: string;
  shopId: string | null;
}

export function VariantsSection({ productId, shopId }: VariantsSectionProps) {
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
