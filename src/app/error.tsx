"use client";

import { ClassifiedErrorScreen } from "@/components/ClassifiedErrorScreen";

export default function GlobalError({
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
      backHref="/"
      backLabel="Go to homepage"
    />
  );
}
