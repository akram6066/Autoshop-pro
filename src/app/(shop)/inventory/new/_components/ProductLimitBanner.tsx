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
            background: "var(--color-danger-light)",
            border: "1px solid var(--color-danger)",
          }}
        >
          <AlertTriangle
            size={16}
            style={{
              color: "var(--color-danger)",
              flexShrink: 0,
              marginTop: 1,
            }}
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--color-danger-text)" }}
            >
              Product limit reached ({productLimit!.current} /{" "}
              {productLimit!.max})
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--color-danger-text)" }}
            >
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
            background: "var(--color-warning-bg)",
            border: "1px solid var(--color-warning-border)",
            color: "var(--color-warning-text-strong)",
          }}
        >
          <AlertTriangle size={13} style={{ flexShrink: 0 }} />
          {productLimit!.current} of {productLimit!.max} products used —
          approaching limit.{" "}
          <Link
            href="/billing"
            style={{
              color: "var(--color-badge-purple-text)",
              textDecoration: "underline",
            }}
          >
            Upgrade
          </Link>
        </div>
      )}
    </>
  );
}
