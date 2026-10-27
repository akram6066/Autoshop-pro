"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getLocalRooms, seedRooms } from "@/lib/db/instance";
import { roomSchema, parseOrThrow } from "@/lib/validations/domain";
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

export function useCreateRoom(shopId: string | null) {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      if (!shopId) throw new Error("No active shop");
      const validated = parseOrThrow(roomSchema, { name });
      const { data, error } = await supabase
        .from("rooms")
        .insert({ shop_id: shopId, name: validated.name })
        .select()
        .single();
      if (error) throw error;
      const currentRooms = await getLocalRooms(shopId);
      await seedRooms(shopId, [...currentRooms, data as Room]);
      return data as Room;
    },
    onSuccess: () => {
      if (shopId) {
        qc.invalidateQueries({ queryKey: roomKeys.all(shopId) });
      }
    },
  });
}

export function useUpdateRoom(shopId: string | null) {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ roomId, name }: { roomId: string; name: string }) => {
      if (!shopId) throw new Error("No active shop");
      const validated = parseOrThrow(roomSchema, { name });
      const { data, error } = await supabase
        .from("rooms")
        .update({ name: validated.name })
        .eq("id", roomId)
        .eq("shop_id", shopId)
        .select()
        .single();
      if (error) throw error;
      const currentRooms = await getLocalRooms(shopId);
      const updated = currentRooms.map((r) =>
        r.id === roomId ? (data as Room) : r,
      );
      await seedRooms(shopId, updated);
      return data as Room;
    },
    onSuccess: () => {
      if (shopId) {
        qc.invalidateQueries({ queryKey: roomKeys.all(shopId) });
      }
    },
  });
}

export function useDeleteRoom(shopId: string | null) {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ roomId }: { roomId: string }) => {
      if (!shopId) throw new Error("No active shop");
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", roomId)
        .eq("shop_id", shopId);
      if (error) throw error;
      const currentRooms = await getLocalRooms(shopId);
      await seedRooms(
        shopId,
        currentRooms.filter((r) => r.id !== roomId),
      );
    },
    onSuccess: () => {
      if (shopId) {
        qc.invalidateQueries({ queryKey: roomKeys.all(shopId) });
      }
    },
  });
}
