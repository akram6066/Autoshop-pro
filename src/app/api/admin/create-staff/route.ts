import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { sanitizeError } from "@/lib/api/errors";

interface StaffInput {
  shop_id: string;
  email: string;
  password: string;
  full_name: string;
}

interface AdminApiExtended {
  getUserByEmail: (email: string) => Promise<{
    data: { user: { id: string; email: string } } | null;
    error: Error | null;
  }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateInput(body: unknown): StaffInput | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (
    typeof b.shop_id !== "string" || !UUID_RE.test(b.shop_id) ||
    typeof b.email !== "string" || !EMAIL_RE.test(b.email) ||
    typeof b.password !== "string" || b.password.length < 8 || b.password.length > 128 ||
    typeof b.full_name !== "string" || !b.full_name.trim() || b.full_name.length > 200
  ) return null;
  return {
    shop_id: b.shop_id,
    email: b.email.trim().toLowerCase(),
    password: b.password,
    full_name: b.full_name.trim(),
  };
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = await enforceRateLimit(
      request,
      { name: "create-staff", limit: 10, windowSec: 3600 },
      user.id
    );
    if (limited) return limited;

    const body = await request.json().catch(() => null);
    const input = validateInput(body);
    if (!input) {
      return NextResponse.json(
        { error: "Invalid input. Required: shop_id (uuid), email, password (8–128 chars), full_name" },
        { status: 400 }
      );
    }

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

    const adminClient = getAdminClient();

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.full_name },
    });

    const alreadyExists =
      createError?.message?.toLowerCase().includes("already been registered") ||
      createError?.message?.toLowerCase().includes("already exists");

    if (alreadyExists) {
      const { data: existingUser, error: lookupError } =
  await (adminClient.auth.admin as unknown as AdminApiExtended).getUserByEmail(input.email);

      if (lookupError || !existingUser?.user) {
        return NextResponse.json(
          { error: "Account exists but could not be found. Contact support." },
          { status: 500 }
        );
      }

      const userId = existingUser.user.id;

      const { error: insertError } = await adminClient
        .from("shop_members")
        .insert({ shop_id: input.shop_id, user_id: userId, role: "staff" });

      if (insertError?.code === "23505") {
        return NextResponse.json(
          { error: "This person is already a member of this shop" },
          { status: 409 }
        );
      }

      if (insertError) {
        const { message, status } = sanitizeError(insertError, {
          log: (e) => console.error("[create-staff] shop_members insert:", e),
        });
        return NextResponse.json({ error: message }, { status });
      }

      await adminClient
        .from("profiles")
        .update({ shop_id: input.shop_id, role: "staff" })
        .eq("id", userId)
        .is("shop_id", null);

      return NextResponse.json({ ok: true, created: false });
    }

    if (createError || !newUser?.user) {
      const { message, status } = sanitizeError(createError, {
        log: (e) => console.error("[create-staff] auth.admin.createUser:", e),
        fallback: "Failed to create account",
      });
      return NextResponse.json({ error: message }, { status });
    }

    const staffUserId = newUser.user.id;

    const { error: upsertError } = await adminClient
      .from("profiles")
      .upsert({
        id: staffUserId,
        full_name: input.full_name,
        shop_id: input.shop_id,
        role: "staff",
      });

    if (upsertError) {
      await adminClient.auth.admin.deleteUser(staffUserId);
      const { message, status } = sanitizeError(upsertError, {
        log: (e) => console.error("[create-staff] profile upsert:", e),
      });
      return NextResponse.json({ error: message }, { status });
    }

    const { error: memberInsertError } = await adminClient
      .from("shop_members")
      .insert({ shop_id: input.shop_id, user_id: staffUserId, role: "staff" });

    if (memberInsertError) {
      await adminClient.auth.admin.deleteUser(staffUserId);
      const { message, status } = sanitizeError(memberInsertError, {
        log: (e) => console.error("[create-staff] shop_members insert:", e),
      });
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({ ok: true, created: true });

  } catch (err) {
    const { message, status } = sanitizeError(err, {
      log: (e) => console.error("[create-staff] unexpected error:", e),
    });
    return NextResponse.json({ error: message }, { status });
  }
}