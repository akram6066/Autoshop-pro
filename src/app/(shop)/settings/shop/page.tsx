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
        .select("id, quantity")
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
    salesCount = salesRes.count ?? 0;

    let totalPieces = 0;
    if (productsRes.data && productsRes.data.length > 0) {
      const productIds = productsRes.data.map((p) => p.id);
      const { data: variants } = await db
        .from("product_variants")
        .select("product_id, quantity")
        .in("product_id", productIds);

      const variantsByProduct = new Map<string, number[]>();
      for (const v of variants ?? []) {
        const arr = variantsByProduct.get(v.product_id) ?? [];
        arr.push(Number(v.quantity) || 0);
        variantsByProduct.set(v.product_id, arr);
      }

      totalPieces = productsRes.data.reduce((sum, p) => {
        const vQty = variantsByProduct.get(p.id);
        if (vQty?.length) {
          return sum + vQty.reduce((a, b) => a + b, 0);
        }
        return sum + (Number(p.quantity) || 0);
      }, 0);
    }
    productCount = totalPieces;

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
