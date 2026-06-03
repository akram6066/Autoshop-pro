"use client";

import { useState, useTransition, Suspense, useEffect } from "react";
import { useMounted } from "@/hooks/useMounted";
import { useRouter, useSearchParams } from "next/navigation";
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
  const isAddingNew = searchParams.get("new") === "1";

  const setAll = useAuthStore((s) => s.setAll);
  const profile = useAuthStore((s) => s.profile);
  const existingShops = useAuthStore(selectShops);

  // Redirect platform admins away from setup — they don't need a shop
  useEffect(() => {
    async function checkAdmin() {
      if (profile?.is_admin) {
        router.replace("/admin");
        return;
      }
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single<{ is_admin: boolean }>();
      if (data?.is_admin) router.replace("/admin");
    }
    checkAdmin();
  }, [profile, router]);

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
      const { data: shopId, error } = await supabase.rpc("setup_owner_shop", {
        p_user_id: user.id,
        p_shop_name: shopName.trim(),
        p_shop_address: shopAddress.trim() || null,
        p_full_name: profile?.full_name ?? "",
      });
      if (error || !shopId) {
        setShopError(error?.message ?? "Failed to create shop");
        return;
      }
      const { data: shop } = await supabase
        .from("shops")
        .select("*")
        .eq("id", shopId)
        .single<Shop>();
      setCreatedShop(
        shop ?? {
          id: shopId as string,
          name: shopName.trim(),
          address: shopAddress.trim() || null,
          created_at: new Date().toISOString(),
        },
      );
      // RPC auto-creates "Main Store" — show it so the user knows it exists
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
      setStep("done");

      setTimeout(() => {
        router.push(isAddingNew ? "/overview" : "/choose-plan");
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
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "var(--color-surface-1)" }}
    >
      <div className="mb-10 text-center animate-fade-in-up">
        <Image
          src="/logo.svg"
          alt="AutoShop Pro"
          width={260}
          height={60}
          className="h-10 w-auto mx-auto mb-6 dark:brightness-0 dark:invert"
          priority
          loading="eager"
        />
        <h1 className="font-display text-3xl mb-1">AutoShop Pro</h1>
        <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
          {isAddingNew ? "Set up your new shop" : "Let's get your shop set up"}
        </p>
      </div>

      <SetupProgressBar steps={STEPS} currentStepIdx={currentStepIdx} />

      <div className="card w-full max-w-md animate-scale-in">
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
  );
}
