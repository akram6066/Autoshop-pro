"use client";

import { useState, useTransition, Suspense } from "react";
import { useMounted } from "@/hooks/useMounted";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { seedLocalCache } from "@/lib/db/instance";
import { useAuthStore, selectShops } from "@/stores/authStore";
import type { Room, Shop, ShopWithRole } from "@/types/app";

type Step = "shop" | "rooms" | "done";

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

  const [step, setStep] = useState<Step>("shop");
  const [isPending, startTransition] = useTransition();
  const mounted = useMounted();
  const [shopError, setShopError] = useState("");
  const [roomsError, setRoomsError] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [createdShop, setCreatedShop] = useState<Shop | null>(null);
  const [rooms, setRooms] = useState<string[]>([]);
  const [newRoom, setNewRoom] = useState("");

  // ─── Step 1: Create shop ──────────────────────────────────────────────────

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
      setStep("rooms");
    });
  }

  // ─── Step 2: Create rooms ─────────────────────────────────────────────────

  async function handleCreateRooms(e: React.FormEvent) {
    e.preventDefault();
    setRoomsError("");
    if (rooms.length === 0) {
      setRoomsError("Create at least one room");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { data: createdRooms, error } = await supabase
        .from("rooms")
        .insert(rooms.map((name) => ({ shop_id: createdShop!.id, name })))
        .select();

      if (error) {
        setRoomsError(error.message);
        return;
      }

      // Seed IndexedDB + default categories in parallel
      await Promise.all([
        seedLocalCache(createdShop!, createdRooms as Room[], []),
        supabase.rpc("seed_default_categories").then(({ error: e }) => {
          if (e) console.error("[setup] seed categories:", e);
        }),
      ]);

      // Fetch fresh profile
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // Build updated shops list — append new shop to existing
      const newShop: ShopWithRole = { ...createdShop!, role: "owner" };
      const updatedShops: ShopWithRole[] = [
        ...existingShops.filter((s) => s.id !== newShop.id),
        newShop,
      ];

      setAll(user, updatedProfile as typeof profile, createdShop, updatedShops);

      setStep("done");

      // New shop → overview (if exists), first shop → dashboard
      setTimeout(() => {
        router.push(isAddingNew ? "/overview" : "/dashboard");
      }, 1200);
    });
  }

  // ─── Room helpers ─────────────────────────────────────────────────────────

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

  function removeRoom(name: string) {
    setRooms((prev) => prev.filter((r) => r !== name));
  }

  // ─── Progress steps ───────────────────────────────────────────────────────

  const steps = [
    { key: "shop", label: "Shop details", num: 1 },
    { key: "rooms", label: "Storage rooms", num: 2 },
    { key: "done", label: "Ready", num: 3 },
  ] as const;

  const currentStepIdx = steps.findIndex((s) => s.key === step);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "var(--color-surface-1)" }}
    >
      {/* Header */}
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
          {isAddingNew
            ? "Set up your new shop"
            : "Let\u2019s get your shop set up"}
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300"
                style={{
                  background:
                    i <= currentStepIdx
                      ? "var(--color-brand-500)"
                      : "var(--color-surface-3)",
                  color:
                    i <= currentStepIdx ? "white" : "var(--color-ink-tertiary)",
                }}
              >
                {i < currentStepIdx ? (
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M5 12l5 5L20 7"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  s.num
                )}
              </div>
              <span
                className="text-sm hidden sm:block"
                style={{
                  color:
                    i <= currentStepIdx
                      ? "var(--color-ink-primary)"
                      : "var(--color-ink-ghost)",
                  fontWeight: i === currentStepIdx ? 500 : 400,
                }}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="w-8 h-px"
                style={{
                  background:
                    i < currentStepIdx
                      ? "var(--color-brand-400)"
                      : "var(--color-border)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="card w-full max-w-md animate-scale-in">
        {/* Step 1 — Shop details */}
        {step === "shop" && (
          <form onSubmit={handleCreateShop} className="p-6">
            <h2 className="text-lg font-medium mb-1">Shop details</h2>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              Your shop name will appear on receipts and reports.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Shop name{" "}
                  <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Nairobi Tyre Centre"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Address{" "}
                  <span
                    style={{ color: "var(--color-ink-ghost)", fontWeight: 400 }}
                  >
                    (optional)
                  </span>
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Mombasa Road, Nairobi"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                />
              </div>
            </div>
            {shopError && (
              <p
                className="mt-3 text-sm"
                style={{ color: "var(--color-danger)" }}
              >
                {shopError}
              </p>
            )}
            <button
              type="submit"
              className="btn btn-primary w-full mt-6"
              disabled={!mounted || isPending || !shopName.trim()}
            >
              {isPending ? "Creating…" : "Continue →"}
            </button>
          </form>
        )}

        {/* Step 2 — Rooms */}
        {step === "rooms" && (
          <form onSubmit={handleCreateRooms} className="p-6">
            <h2 className="text-lg font-medium mb-1">Storage rooms</h2>
            <p
              className="text-sm mb-5"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              Rooms help you organise where parts are stored. Add as many as you
              need.
            </p>
            <div className="space-y-2 mb-4">
              {rooms.length === 0 && (
                <p
                  className="text-sm"
                  style={{ color: "var(--color-ink-ghost)" }}
                >
                  No rooms added yet. Add at least one below.
                </p>
              )}
              {rooms.map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                  style={{
                    background: "var(--color-surface-1)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <span className="text-sm">{name}</span>
                  <button
                    type="button"
                    onClick={() => removeRoom(name)}
                    className="btn btn-ghost btn-sm btn-icon"
                    aria-label={`Remove ${name}`}
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                type="text"
                placeholder="Room name…"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRoom();
                  }
                }}
              />
              <button
                type="button"
                onClick={addRoom}
                className="btn btn-secondary"
              >
                Add
              </button>
            </div>
            {roomsError && (
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--color-danger)" }}
              >
                {roomsError}
              </p>
            )}
            <button
              type="submit"
              className="btn btn-primary w-full mt-6"
              disabled={!mounted || isPending || rooms.length === 0}
            >
              {isPending
                ? "Setting up…"
                : `Finish setup with ${rooms.length} room${rooms.length !== 1 ? "s" : ""}`}
            </button>
          </form>
        )}

        {/* Step 3 — Done */}
        {step === "done" && (
          <div className="p-8 text-center animate-scale-in">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
              style={{ background: "var(--color-success-light)" }}
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                <path
                  d="M5 12l5 5L20 7"
                  stroke="var(--color-success)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-xl font-medium mb-2">
              {isAddingNew ? "New shop created!" : "You\u2019re all set!"}
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              {isAddingNew
                ? "Taking you to your overview…"
                : "Taking you to your dashboard…"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
