"use client";

import { useQuery } from "@tanstack/react-query";
import type { SubInfo } from "@/app/(shop)/settings/_components/PlanUsageSection";

async function fetchSubscription(): Promise<SubInfo | null> {
  const res = await fetch("/api/subscription/status");
  if (!res.ok) throw new Error("Failed to load subscription");
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data as SubInfo;
}

export function useSubscription() {
  const { data: sub = null, isLoading: subLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: fetchSubscription,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  return { sub, subLoading };
}
