import type { User } from "@supabase/supabase-js";
import type { createClient } from "@/lib/supabase/client";
import type { Profile, Shop, ShopWithRole } from "@/types/app";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

interface ShopMemberRow {
  shop_id: string;
  role: "owner" | "staff";
  shops: {
    id: string;
    name: string;
    address: string | null;
    created_at: string;
    plan?: string;
  } | null;
}

export interface AuthSessionState {
  user: User;
  profile: Profile;
  activeShop: Shop | null;
  shops: ShopWithRole[];
  destination: string;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withAuthTimeout<T>(
  promise: PromiseLike<T>,
  action = "Auth request",
  ms = 15000,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${action} timed out. Please try again.`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function fetchProfile(
  supabase: SupabaseBrowserClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<Profile>();

  if (error) throw error;
  return data ?? null;
}

async function fetchProfileWithRetry(
  supabase: SupabaseBrowserClient,
  userId: string,
): Promise<Profile | null> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const profile = await fetchProfile(supabase, userId);
    if (profile) return profile;
    await delay(250);
  }

  return null;
}

export async function loadAuthSessionState(
  supabase: SupabaseBrowserClient,
  user: User,
): Promise<AuthSessionState> {
  const profile = await fetchProfileWithRetry(supabase, user.id);

  if (!profile) {
    throw new Error(
      "Account setup is not ready yet. Please try again in a moment.",
    );
  }

  const { data, error } = await supabase
    .from("shop_members")
    .select("shop_id, role, shops(*)")
    .eq("user_id", user.id);

  if (error) throw error;

  const rows = (data ?? []) as ShopMemberRow[];
  const shops: ShopWithRole[] = rows
    .filter((membership) => membership.shops)
    .map((membership) => ({
      ...membership.shops!,
      role: membership.role,
    }));

  const activeShop =
    (shops.find((shop) => shop.id === profile.shop_id) as Shop | undefined) ??
    (shops[0] as Shop | undefined) ??
    null;

  return {
    user,
    profile,
    activeShop,
    shops,
    destination: activeShop ? "/dashboard" : "/setup",
  };
}
