"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

interface Props {
  productLimit: { max: number; current: number } | null;
  productAtLimit: boolean;
  productNearLimit: boolean;
}

export function ProductLimitBanner({
  productLimit,
  productAtLimit,
  productNearLimit,
}: Props) {
  return (
    <>
      {productAtLimit && (
        <div
          className="mb-4 flex items-start gap-3 p-4 rounded-xl"
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
          }}
        >
          <AlertTriangle
            size={16}
            style={{ color: "#dc2626", flexShrink: 0, marginTop: 1 }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#991b1b" }}>
              Product limit reached ({productLimit!.current} /{" "}
              {productLimit!.max})
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#b91c1c" }}>
              You&apos;ve used all your product slots. Upgrade your plan to add
              more products.
            </p>
          </div>
          <Link
            href="/billing"
            className="btn btn-primary btn-sm"
            style={{ whiteSpace: "nowrap" }}
          >
            Upgrade
          </Link>
        </div>
      )}

      {productNearLimit && (
        <div
          className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
          style={{
            background: "#fffbeb",
            border: "1px solid #fcd34d",
            color: "#92400e",
          }}
        >
          <AlertTriangle size={13} style={{ flexShrink: 0 }} />
          {productLimit!.current} of {productLimit!.max} products used —
          approaching limit.{" "}
          <Link
            href="/billing"
            style={{ color: "#7c3aed", textDecoration: "underline" }}
          >
            Upgrade
          </Link>
        </div>
      )}
    </>
  );
}
