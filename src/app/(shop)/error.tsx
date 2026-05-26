"use client";

import { ClassifiedErrorScreen } from "@/components/ClassifiedErrorScreen";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ClassifiedErrorScreen
      error={error}
      reset={reset}
      backHref="/dashboard"
      backLabel="Back to dashboard"
    />
  );
}
