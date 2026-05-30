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
  ms = 12000,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      reject(
        new Error(
          offline
            ? `${action} failed — you appear to be offline. Please check your internet connection.`
            : `${action} timed out. Your internet may be slow or unstable — please try again.`,
        ),
      );
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

  if (error) throw new Error(error.message);
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
  planParam?: string | null,
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

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as ShopMemberRow[];
  const shops: ShopWithRole[] = rows
    .filter((membership) => membership.shops)
    .map((membership) => ({
      ...membership.shops!,
      role: membership.role,
    }));

  const activeShopWithRole: ShopWithRole | null =
    shops.find((shop) => shop.id === profile.shop_id) ?? shops[0] ?? null;

  const activeShop = activeShopWithRole as Shop | null;

  // shop_members.role is the authoritative per-shop role; profile.role is a
  // denormalised fallback only. Merge here so every caller (login, signup,
  // layout init) receives a consistent profile without each one patching it.
  const profileWithRole: Profile = {
    ...profile,
    role: activeShopWithRole?.role ?? profile.role,
  };

  const plan = planParam && /^[a-z_]+$/.test(planParam) ? planParam : null;

  const base = !activeShopWithRole
    ? profile.is_admin
      ? "/admin"
      : "/setup"
    : activeShopWithRole.role === "staff"
      ? "/pos"
      : "/dashboard";

  const destination =
    plan && base !== "/pos"
      ? base === "/setup"
        ? `/setup?plan=${plan}`
        : `/billing?plan=${plan}`
      : base;

  return { user, profile: profileWithRole, activeShop, shops, destination };
}
