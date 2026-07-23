"use client";

import { useState, useTransition, Suspense, useEffect } from "react";
import { useMounted } from "@/hooks/useMounted";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { seedLocalCache } from "@/lib/db/instance";
import { useAuthStore, selectShops } from "@/stores/authStore";
import type { Room, Shop, ShopWithRole, CategoryItem } from "@/types/app";
import SetupProgressBar from "./_components/SetupProgressBar";
import SetupShopStep from "./_components/SetupShopStep";
import SetupRoomsStep from "./_components/SetupRoomsStep";
import SetupCategoriesStep, {
  PRESET_COLORS,
} from "./_components/SetupCategoriesStep";
import SetupDoneStep from "./_components/SetupDoneStep";

type Step = "shop" | "rooms" | "categories" | "done";

const STEPS = [
  { key: "shop", label: "Shop details", num: 1 },
  { key: "rooms", label: "Storage rooms", num: 2 },
  { key: "categories", label: "Categories", num: 3 },
  { key: "done", label: "Ready", num: 4 },
] as const;

export default function SetupPage() {
  return (
    <Suspense>
      <SetupContent />
    </Suspense>
  );
}

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const isAddingNew = searchParams.get("new") === "1";
  const planParam = searchParams.get("plan");
  const intervalParam = searchParams.get("interval");

  const setAll = useAuthStore((s) => s.setAll);
  const profile = useAuthStore((s) => s.profile);
  const existingShops = useAuthStore(selectShops);

  // Gate checks: redirect admins, and redirect users who already own a shop
  // back to the dashboard when they land on first-time setup by mistake.
  useEffect(() => {
    async function checkGates() {
      if (profile?.is_admin) {
        router.replace("/admin");
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single<{ is_admin: boolean }>();
      if (prof?.is_admin) {
        router.replace("/admin");
        return;
      }

      // If this is first-time setup (not adding a new shop) and the user
      // already owns a shop, send them to the dashboard instead of letting
      // them create a duplicate on the free plan.
      if (!isAddingNew) {
        const { count } = await supabase
          .from("shop_members")
          .select("shop_id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("role", "owner");
        if ((count ?? 0) > 0) {
          router.replace("/dashboard");
          return;
        }
      }
    }
    checkGates();
  }, [profile, router, isAddingNew]);

  const [step, setStep] = useState<Step>("shop");
  const [isPending, startTransition] = useTransition();
  const mounted = useMounted();

  // Step 1
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopError, setShopError] = useState("");
  const [createdShop, setCreatedShop] = useState<Shop | null>(null);

  // Step 2
  const [rooms, setRooms] = useState<string[]>([]);
  const [newRoom, setNewRoom] = useState("");
  const [roomsError, setRoomsError] = useState("");

  // Step 3
  const [setupCategories, setSetupCategories] = useState<CategoryItem[]>([]);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState(PRESET_COLORS[0]);
  const [catError, setCatError] = useState("");
  const [catAdding, setCatAdding] = useState(false);

  // ── Step 1 handler ────────────────────────────────────────────────────────

  async function handleCreateShop(e: React.FormEvent) {
    e.preventDefault();
    setShopError("");
    if (!shopName.trim()) {
      setShopError("Shop name is required");
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setShopError("Not logged in");
        return;
      }

      let resolvedShop: Shop | null = null;

      if (isAddingNew) {
        // Second+ shop — plan limit is enforced inside this RPC
        const { data: shopJson, error } = await supabase.rpc(
          "create_additional_shop",
          {
            p_name: shopName.trim(),
            p_address: shopAddress.trim() || null,
          },
        );
        if (error) {
          setShopError(
            error.message === "shop_limit_reached"
              ? "Your plan does not allow more shops. Upgrade to add another."
              : (error.message ?? "Failed to create shop"),
          );
          return;
        }
        resolvedShop = shopJson as unknown as Shop;
      } else {
        // First-time setup — plan limit is enforced inside this RPC
        const { data: shopId, error } = await supabase.rpc("setup_owner_shop", {
          p_user_id: user.id,
          p_shop_name: shopName.trim(),
          p_shop_address: shopAddress.trim() || null,
          p_full_name: profile?.full_name ?? "",
        });
        if (error) {
          setShopError(
            error.message === "shop_limit_reached"
              ? "You already have a shop on this account. Go to your dashboard."
              : (error.message ?? "Failed to create shop"),
          );
          return;
        }
        if (!shopId) {
          setShopError("Failed to create shop");
          return;
        }
        const { data: shop } = await supabase
          .from("shops")
          .select("*")
          .eq("id", shopId)
          .single<Shop>();
        resolvedShop = shop ?? {
          id: shopId as string,
          name: shopName.trim(),
          address: shopAddress.trim() || null,
          created_at: new Date().toISOString(),
          plan: "trial",
          tax_rate: 0,
        };
      }

      if (!resolvedShop) {
        setShopError("Failed to create shop");
        return;
      }
      setCreatedShop(resolvedShop);
      // RPC auto-creates "Main Store" — pre-populate so user sees it
      setRooms(["Main Store"]);
      setStep("rooms");
    });
  }

  // ── Step 2 handler ────────────────────────────────────────────────────────

  async function handleCreateRooms(e: React.FormEvent) {
    e.preventDefault();
    setRoomsError("");
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) return;
      if (!createdShop) {
        setRoomsError("Shop not found. Please restart setup.");
        return;
      }

      // "Main Store" is auto-created by the RPC — only insert extra rooms the user added
      const extraRooms = rooms.filter((name) => name !== "Main Store");
      if (extraRooms.length > 0) {
        const { error } = await supabase
          .from("rooms")
          .insert(extraRooms.map((name) => ({ shop_id: createdShop.id, name })))
          .select();
        if (error) {
          setRoomsError(error.message);
          return;
        }
      }

      // Fetch all rooms (including the auto-created Main Store) for the local cache
      const { data: allRooms } = await supabase
        .from("rooms")
        .select("*")
        .eq("shop_id", createdShop.id);

      await seedLocalCache(createdShop, (allRooms as Room[]) ?? [], []);

      const { data: cats } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      setSetupCategories((cats as CategoryItem[]) ?? []);
      setStep("categories");
    });
  }

  // ── Step 3 handlers ───────────────────────────────────────────────────────

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!catName.trim()) return;
    setCatError("");
    setCatAdding(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: catName.trim(),
          color: catColor,
        })
        .select()
        .single();
      if (error) throw error;
      setSetupCategories((prev) => [...prev, data as CategoryItem]);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setCatName("");
      setCatColor(
        PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
      );
    } catch (err: unknown) {
      setCatError(
        err instanceof Error ? err.message : "Failed to add category",
      );
    } finally {
      setCatAdding(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    setCatError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      setSetupCategories((prev) => prev.filter((c) => c.id !== id));
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: unknown) {
      setCatError(
        err instanceof Error ? err.message : "Failed to delete category",
      );
    }
  }

  // ── Finish (Finish button + Skip both call this) ──────────────────────────

  function handleFinishSetup() {
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!createdShop) return;
      const newShop: ShopWithRole = { ...createdShop, role: "owner" };
      const updatedShops: ShopWithRole[] = [
        ...existingShops.filter((s) => s.id !== newShop.id),
        newShop,
      ];
      setAll(user, updatedProfile as typeof profile, createdShop, updatedShops);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setStep("done");

      setTimeout(() => {
        if (isAddingNew) {
          router.push("/overview");
        } else {
          const query = [];
          if (planParam) query.push(`plan=${planParam}`);
          if (intervalParam) query.push(`interval=${intervalParam}`);
          const queryString = query.length > 0 ? `?${query.join("&")}` : "";
          router.push(`/choose-plan${queryString}`);
        }
      }, 1200);
    });
  }

  // ── Room helpers ──────────────────────────────────────────────────────────

  function addRoom() {
    const name = newRoom.trim();
    if (!name) return;
    if (rooms.includes(name)) {
      setRoomsError("Room already exists");
      return;
    }
    setRooms((prev) => [...prev, name]);
    setNewRoom("");
    setRoomsError("");
  }

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "var(--color-surface-1)" }}
    >
      {/* Luxury Background Gradients */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[128px] opacity-40 dark:opacity-20 animate-fade-in"
        style={{ background: "var(--color-brand-200)" }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[128px] opacity-30 dark:opacity-10 animate-fade-in"
        style={{ background: "var(--color-brand-400)" }}
      />

      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center">
        <div className="mb-10 text-center animate-fade-in-up">
          <Image
            src="/logo-color.svg"
            alt="AutoShop Pro"
            width={260}
            height={60}
            className="h-10 w-auto mx-auto mb-6 dark:hidden drop-shadow-sm"
            style={{ width: "auto", height: "auto" }}
            priority
            loading="eager"
          />
          <Image
            src="/logo-dark.svg"
            alt="AutoShop Pro"
            width={260}
            height={60}
            className="h-10 w-auto mx-auto mb-6 hidden dark:block drop-shadow-sm"
            style={{ width: "auto", height: "auto" }}
            priority
            loading="eager"
          />
          <h1 className="font-display text-4xl mb-2 text-transparent bg-clip-text bg-gradient-to-br from-[var(--color-ink-primary)] to-[var(--color-ink-tertiary)]">
            AutoShop Pro
          </h1>
          <p
            className="text-base"
            style={{ color: "var(--color-ink-secondary)" }}
          >
            {isAddingNew
              ? "Set up your new shop"
              : "Let's get your shop set up"}
          </p>
        </div>

        <SetupProgressBar steps={STEPS} currentStepIdx={currentStepIdx} />

        <div
          className="w-full rounded-2xl animate-scale-in"
          style={{
            background: "var(--color-surface-0)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-raised)",
          }}
        >
          {step === "shop" && (
            <SetupShopStep
              shopName={shopName}
              shopAddress={shopAddress}
              error={shopError}
              isPending={isPending}
              mounted={mounted}
              onShopNameChange={setShopName}
              onShopAddressChange={setShopAddress}
              onSubmit={handleCreateShop}
            />
          )}
          {step === "rooms" && (
            <SetupRoomsStep
              rooms={rooms}
              newRoom={newRoom}
              error={roomsError}
              isPending={isPending}
              mounted={mounted}
              onNewRoomChange={setNewRoom}
              onAddRoom={addRoom}
              onRemoveRoom={(name) =>
                setRooms((p) => p.filter((r) => r !== name))
              }
              onSubmit={handleCreateRooms}
            />
          )}
          {step === "categories" && (
            <SetupCategoriesStep
              categories={setupCategories}
              catName={catName}
              catColor={catColor}
              error={catError}
              catAdding={catAdding}
              isPending={isPending}
              mounted={mounted}
              onCatNameChange={setCatName}
              onCatColorChange={setCatColor}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onFinish={handleFinishSetup}
            />
          )}
          {step === "done" && <SetupDoneStep isAddingNew={isAddingNew} />}
        </div>
      </div>
    </div>
  );
}
