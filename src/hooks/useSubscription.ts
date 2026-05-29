"use client";
import { useState, useEffect } from "react";
import type { SubInfo } from "@/app/(shop)/settings/_components/PlanUsageSection";

export function useSubscription() {
  const [sub, setSub] = useState<SubInfo | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setSub(data as SubInfo);
      })
      .finally(() => setSubLoading(false));
  }, []);

  return { sub, subLoading };
}
