"use client";
import { useAuthStore, selectShopId, selectShops } from "@/stores/authStore";
import { PlanUsageSection } from "../_components/PlanUsageSection";
import { MyShopsSection } from "../_components/MyShopsSection";
import { useSubscription } from "@/hooks/useSubscription";

export default function PlanPage() {
  const { sub, subLoading } = useSubscription();
  const shopId = useAuthStore(selectShopId);
  const shops = useAuthStore(selectShops);
  const ownedShopCount = shops.filter((s) => s.role === "owner").length;

  return (
    <div>
      <PlanUsageSection
        sub={sub}
        subLoading={subLoading}
        ownedShopCount={ownedShopCount}
        shopId={shopId}
      />
      <MyShopsSection sub={sub} />
    </div>
  );
}
