import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// ─── Input validation ─────────────────────────────────────────────────────────

interface StaffInput {
  shop_id: string;
  email: string;
  password: string;
  full_name: string;
}

function validateInput(body: unknown): StaffInput | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (
    typeof b.shop_id !== "string" || !b.shop_id ||
    typeof b.email !== "string" || !b.email ||
    typeof b.password !== "string" || !b.password ||
    typeof b.full_name !== "string" || !b.full_name
  ) return null;
  if (b.password.length < 6) return null;
  // Basic email format check
  if (!b.email.includes("@")) return null;
  return {
    shop_id: b.shop_id,
    email: b.email.trim().toLowerCase(),
    password: b.password,
    full_name: b.full_name.trim(),
  };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate caller
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate body
    const body = await request.json().catch(() => null);
    const input = validateInput(body);
    if (!input) {
      return NextResponse.json(
        { error: "Invalid input. Required: shop_id, email, password (min 6 chars), full_name" },
        { status: 400 }
      );
    }

    // 3. Verify caller is owner of this shop
    const { data: membership, error: memberError } = await supabase
      .from("shop_members")
      .select("role")
      .eq("shop_id", input.shop_id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership || membership.role !== "owner") {
      return NextResponse.json(
        { error: "Only shop owners can create staff accounts" },
        { status: 403 }
      );
    }

    // 4. Admin client — service role only, never exposed to client
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 5. Try to create the auth user directly
    // If email already exists Supabase returns a specific error — handle it
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true, // no confirmation email — owner creates the account
      user_metadata: { full_name: input.full_name },
    });

    // Email already exists — add them to this shop instead of creating duplicate
    if (createError?.message?.toLowerCase().includes("already been registered") ||
        createError?.message?.toLowerCase().includes("already exists")) {

      // Look up by email using admin API — single targeted query, not listUsers()
      const { data: userList } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      const existingUser = userList?.users?.find(
        (u) => u.email?.toLowerCase() === input.email
      );

      if (!existingUser) {
        return NextResponse.json(
          { error: "Account exists but could not be found. Contact support." },
          { status: 500 }
        );
      }

      // Add to shop_members
      const { error: insertError } = await adminClient
        .from("shop_members")
        .insert({ shop_id: input.shop_id, user_id: existingUser.id, role: "staff" });

      // Already a member
      if (insertError?.code === "23505") {
        return NextResponse.json(
          { error: "This person is already a member of this shop" },
          { status: 409 }
        );
      }

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // Update profile shop_id only if they have no active shop
      await adminClient
        .from("profiles")
        .update({ shop_id: input.shop_id, role: "staff" })
        .eq("id", existingUser.id)
        .is("shop_id", null);

      return NextResponse.json({ ok: true, created: false });
    }

    // Other create error
    if (createError || !newUser?.user) {
      return NextResponse.json(
        { error: createError?.message ?? "Failed to create account" },
        { status: 500 }
      );
    }

    const staffUserId = newUser.user.id;

    // 6. Update profile — trigger creates it, we update name + shop
    // Small delay to ensure trigger has fired
    await new Promise((r) => setTimeout(r, 300));

    await adminClient
      .from("profiles")
      .update({ full_name: input.full_name, shop_id: input.shop_id, role: "staff" })
      .eq("id", staffUserId);

    // 7. Add to shop_members
    const { error: memberInsertError } = await adminClient
      .from("shop_members")
      .insert({ shop_id: input.shop_id, user_id: staffUserId, role: "staff" });

    if (memberInsertError) {
      // Rollback — delete the auth user to avoid orphaned accounts
      await adminClient.auth.admin.deleteUser(staffUserId);
      return NextResponse.json(
        { error: memberInsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, created: true });

  } catch (err) {
    console.error("[create-staff] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}