"use client";

import { ClassifiedErrorScreen } from "@/components/ClassifiedErrorScreen";

export default function AdminError({
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
      backHref="/admin/dashboard"
      backLabel="Back to dashboard"
    />
  );
}
