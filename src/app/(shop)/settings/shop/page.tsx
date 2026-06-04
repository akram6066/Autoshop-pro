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

  // Active shop is the one stored on the profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("shop_id")
    .eq("id", user.id)
    .single();

  const shopId = profile?.shop_id ?? null;

  // Check ownership via shop_members (source of truth for per-shop role)
  let isOwner = false;
  if (shopId) {
    const { data: membership } = await supabase
      .from("shop_members")
      .select("role")
      .eq("shop_id", shopId)
      .eq("user_id", user.id)
      .maybeSingle();
    isOwner = membership?.role === "owner";
  }

  let shopName = "";
  let productCount = 0;
  let salesCount = 0;
  let otherShops: { id: string; name: string }[] = [];

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
      // All shops the user owns (excluding current) — to show in the confirmation
      db
        .from("shop_members")
        .select("shop_id, shops!inner(id, name)")
        .eq("user_id", user.id)
        .eq("role", "owner")
        .neq("shop_id", shopId)
        .is("shops.deleted_at" as string, null),
    ]);

    shopName = shopRes.data?.name ?? "";
    productCount = productsRes.count ?? 0;
    salesCount = salesRes.count ?? 0;

    type MemberRow = { shop_id: string; shops: { id: string; name: string } };
    otherShops = ((membershipsRes.data ?? []) as unknown as MemberRow[]).map(
      (m) => ({ id: m.shops.id, name: m.shops.name }),
    );
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
          otherShops={otherShops}
        />
      )}
    </>
  );
}
