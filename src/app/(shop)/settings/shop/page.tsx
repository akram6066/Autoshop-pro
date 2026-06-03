import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/admin/db";
import { Section } from "../_components/Section";
import { ShopForm } from "../_components/ShopForm";
import { DeleteShopSection } from "./_components/DeleteShopSection";

export default async function ShopPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch active shop from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("shop_id, role")
    .eq("id", user.id)
    .single();

  // Only owners see the danger zone
  const shopId = profile?.shop_id ?? null;
  const isOwner = profile?.role === "owner";

  let shopName = "";
  let productCount = 0;
  let salesCount = 0;
  let hasOtherShops = false;

  if (shopId && isOwner) {
    const db = adminDb();
    const [shopRes, productsRes, salesRes, membershipsRes] = await Promise.all([
      db.from("shops").select("name").eq("id", shopId).single(),
      db
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId),
      db
        .from("sales")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId),
      db
        .from("shop_members")
        .select("shop_id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("role", "owner"),
    ]);

    shopName = shopRes.data?.name ?? "";
    productCount = productsRes.count ?? 0;
    salesCount = salesRes.count ?? 0;
    hasOtherShops = (membershipsRes.count ?? 0) > 1;
  }

  return (
    <>
      <Section title="Shop details">
        <ShopForm />
      </Section>

      {isOwner && shopId && (
        <DeleteShopSection
          shopId={shopId}
          shopName={shopName}
          productCount={productCount}
          salesCount={salesCount}
          hasOtherShops={hasOtherShops}
        />
      )}
    </>
  );
}
