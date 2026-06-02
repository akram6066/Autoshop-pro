import { redirect } from "next/navigation";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/admin/db";
import { PlanCards } from "./_components/PlanCards";

export const metadata = { title: "Choose your plan — AutoShop Pro" };

export default async function ChoosePlanPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = adminDb();
  const [{ data: plans }, { data: trialSetting }] = await Promise.all([
    db
      .from("subscription_plans")
      .select(
        "name, display_name, price_kes, max_shops, max_products_per_shop, max_staff_per_shop, max_sales_per_month",
      )
      .eq("is_active", true)
      .in("name", ["trial", "pro", "ultra_pro"])
      .order("price_kes"),
    db
      .from("app_settings")
      .select("value")
      .eq("key", "trial")
      .single<{ value: { enabled: boolean; days: number } }>(),
  ]);

  const trialEnabled = trialSetting?.value?.enabled ?? true;
  const trialDays = trialSetting?.value?.days ?? 30;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-surface-1)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <div style={{ marginBottom: 40 }}>
        <Image
          src="/logo.svg"
          alt="AutoShop Pro"
          width={200}
          height={46}
          className="h-8 w-auto dark:hidden"
          style={{ width: "auto" }}
          priority
        />
        <Image
          src="/logo-dark.svg"
          alt="AutoShop Pro"
          width={200}
          height={46}
          className="h-8 w-auto hidden dark:block"
          style={{ width: "auto" }}
          priority
        />
      </div>

      <PlanCards
        plans={plans ?? []}
        trialEnabled={trialEnabled}
        trialDays={trialDays}
      />
    </div>
  );
}
