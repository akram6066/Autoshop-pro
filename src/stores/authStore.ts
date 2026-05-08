import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { User } from "@supabase/supabase-js";
import type { Profile, Shop, ShopWithRole, UserRole } from "@/types/app";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  // Active shop (the one currently being used)
  shop: Shop | null;
  // All shops this user belongs to
  shops: ShopWithRole[];
  role: UserRole | null;
  shopId: string | null;

  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setShop: (shop: Shop | null) => void;
  setShops: (shops: ShopWithRole[]) => void;
  switchShop: (shop: ShopWithRole) => Promise<void>;
  setAll: (user: User | null, profile: Profile | null, shop: Shop | null, shops?: ShopWithRole[]) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  profile: null,
  shop: null,
  shops: [],
  role: null,
  shopId: null,
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setUser: (user) => set({ user }, false, "setUser"),

        // role removed — role is per-shop, set only by setAll() and switchShop()
        setProfile: (profile) =>
          set(
            {
              profile,
              shopId: profile?.shop_id ?? null,
            },
            false,
            "setProfile"
          ),

        setShop: (shop) => set({ shop, shopId: shop?.id ?? null }, false, "setShop"),

        setShops: (shops) => set({ shops }, false, "setShops"),

        // Switch active shop — calls Supabase RPC then updates local state
        switchShop: async (shopWithRole) => {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          await supabase.rpc("switch_active_shop", { p_shop_id: shopWithRole.id });
          set(
            {
              shop: shopWithRole,
              shopId: shopWithRole.id,
              role: shopWithRole.role,
            },
            false,
            "switchShop"
          );
        },

        setAll: (user, profile, shop, shops = []) =>
          set(
            {
              user,
              profile,
              shop,
              shops,
              role: profile?.role ?? null,
              shopId: shop?.id ?? profile?.shop_id ?? null,
            },
            false,
            "setAll"
          ),

        reset: () => set(initialState, false, "reset"),
      }),
      {
        name: "autoshop-auth",
        partialize: (state) => ({
          shop: state.shop,
          shops: state.shops,
          role: state.role,
          shopId: state.shopId,
        }),
      }
    ),
    { name: "AuthStore" }
  )
);

export const selectUser = (s: AuthState) => s.user;
export const selectProfile = (s: AuthState) => s.profile;
export const selectShop = (s: AuthState) => s.shop;
export const selectShops = (s: AuthState) => s.shops;
export const selectRole = (s: AuthState) => s.role;
export const selectShopId = (s: AuthState) => s.shopId;
export const selectIsOwner = (s: AuthState) => s.role === "owner";
export const selectIsStaff = (s: AuthState) => s.role === "staff";
export const selectHasShop = (s: AuthState) => s.shopId !== null;
export const selectHasMultipleShops = (s: AuthState) => s.shops.length > 1;