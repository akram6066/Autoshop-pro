import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { sanitizeError } from "@/lib/api/errors";
import { checkLimit } from "@/lib/api/limit-check";
import { logRequest } from "@/lib/api/logger";
import { staffInviteSchema } from "@/lib/validations/api";
import { withAuth } from "@/lib/api/with-auth";
import type { Plan } from "@/lib/limits";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export const POST = withAuth(
  async (request: NextRequest, { user, supabase }) => {
    try {
      logRequest(request, user.id);

      const limited = await enforceRateLimit(
        request,
        { name: "create-staff", limit: 10, windowSec: 3600 },
        user.id,
      );
      if (limited) return limited;

      const body = await request.json().catch(() => null);
      const result = staffInviteSchema.safeParse(body);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error.issues[0].message },
          { status: 400 },
        );
      }
      const input = result.data;

      const { data: membership, error: memberError } = await supabase
        .from("shop_members")
        .select("role")
        .eq("shop_id", input.shop_id)
        .eq("user_id", user.id)
        .single();

      if (memberError || !membership || membership.role !== "owner") {
        return NextResponse.json(
          { error: "Only shop owners can create staff accounts" },
          { status: 403 },
        );
      }

      const { data: shopData } = await supabase
        .from("shops")
        .select("plan")
        .eq("id", input.shop_id)
        .single();
      const plan: Plan = shopData?.plan === "pro" ? "pro" : "free";
      const limitResult = await checkLimit(
        supabase,
        input.shop_id,
        "staff",
        plan,
      );
      if (!limitResult.allowed) {
        return NextResponse.json(
          { error: "Staff limit reached. Free plan allows 3 staff members." },
          { status: 403 },
        );
      }

      const adminClient = getAdminClient();

      const { data: newUser, error: createError } =
        await adminClient.auth.admin.createUser({
          email: input.email,
          password: input.password,
          email_confirm: true,
          user_metadata: { full_name: input.full_name },
        });

      const alreadyExists =
        createError?.message
          ?.toLowerCase()
          .includes("already been registered") ||
        createError?.message?.toLowerCase().includes("already exists");

      if (alreadyExists) {
        // Invite is tied to the email — no user lookup needed
        const { error: inviteError } = await supabase.rpc(
          "create_shop_invite",
          {
            p_shop_id: input.shop_id,
            p_email: input.email,
            p_role: "staff",
          },
        );

        if (inviteError) {
          if (inviteError.message.includes("unique constraint")) {
            return NextResponse.json(
              { error: "A pending invitation already exists for this email" },
              { status: 409 },
            );
          }
          const { message, status } = sanitizeError(inviteError, {
            log: (e) =>
              console.error("[create-staff] create_shop_invite error:", e),
          });
          return NextResponse.json({ error: message }, { status });
        }

        return NextResponse.json({ ok: true, created: false, invited: true });
      }

      if (createError || !newUser?.user) {
        const { message, status } = sanitizeError(createError, {
          log: (e) => console.error("[create-staff] auth.admin.createUser:", e),
          fallback: "Failed to create account",
        });
        return NextResponse.json({ error: message }, { status });
      }

      const staffUserId = newUser.user.id;

      await adminClient.from("profiles").upsert({
        id: staffUserId,
        full_name: input.full_name,
        role: "staff",
      });

      const { error: inviteError } = await supabase.rpc("create_shop_invite", {
        p_shop_id: input.shop_id,
        p_email: input.email,
        p_role: "staff",
      });

      if (inviteError) {
        const { message, status } = sanitizeError(inviteError, {
          log: (e) =>
            console.error("[create-staff] invite failed for new user:", e),
          fallback:
            "Account created but could not be added to shop. Contact support.",
        });
        return NextResponse.json({ error: message }, { status });
      }

      return NextResponse.json({ ok: true, created: true, invited: true });
    } catch (err) {
      const { message, status } = sanitizeError(err, {
        log: (e) => console.error("[create-staff] unexpected error:", e),
      });
      return NextResponse.json({ error: message }, { status });
    }
  },
);
