"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { movementKeys } from "./useInventoryMovements";
import type { ProductAuditEvent } from "@/types/app";

/**
 * Fetch product lifecycle audit events (created, updated, archived, restored).
 */
export function useProductAuditEvents(
  productId: string,
  teamMap?: Record<string, string>,
) {
  const supabase = createClient();

  return useQuery({
    queryKey: movementKeys.audit(productId),
    enabled: !!productId,
    queryFn: async (): Promise<ProductAuditEvent[]> => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const logs = (data ?? []) as Array<{
        id: string;
        shop_id: string | null;
        user_id: string | null;
        event_type: string;
        entity_type: string;
        entity_id: string;
        payload: Record<string, unknown>;
        severity: "info" | "warning" | "critical";
        created_at: string;
      }>;

      if (logs.length === 0) return [];

      let userMap: Map<string, string>;
      if (teamMap) {
        userMap = new Map(Object.entries(teamMap));
      } else {
        const userIds = [
          ...new Set(logs.map((l) => l.user_id).filter(Boolean)),
        ] as string[];

        const { data: profiles } =
          userIds.length > 0
            ? await supabase
                .from("profiles")
                .select("id, full_name")
                .in("id", userIds)
            : { data: [] };

        userMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
      }

      return logs.map((l) => ({
        ...l,
        payload: l.payload as ProductAuditEvent["payload"],
        user_name: l.user_id ? userMap.get(l.user_id) || "Staff" : undefined,
      }));
    },
    staleTime: 1000 * 30,
  });
}
