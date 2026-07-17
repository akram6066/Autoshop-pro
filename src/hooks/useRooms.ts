"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getLocalRooms, seedRooms } from "@/lib/db/instance";
import type { Room } from "@/types/app";

export const roomKeys = {
  all: (shopId: string) => ["rooms", shopId] as const,
};

export function useRooms(shopId: string | null) {
  return useQuery({
    queryKey: shopId ? roomKeys.all(shopId) : ["rooms-disabled"],
    queryFn: async (): Promise<Room[]> => {
      try {
        const { data, error } = await createClient()
          .from("rooms")
          .select("*")
          .eq("shop_id", shopId!)
          .order("name");
        if (error) throw error;
        await seedRooms(shopId!, data as Room[]);
        return data as Room[];
      } catch (err) {
        console.warn("[useRooms] Supabase fetch failed, using IndexedDB:", err);
        return getLocalRooms(shopId!);
      }
    },
    enabled: !!shopId,
    staleTime: 1000 * 60 * 5,
  });
}
