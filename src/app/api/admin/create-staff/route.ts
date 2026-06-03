import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { sanitizeError } from "@/lib/api/errors";
import { logRequest } from "@/lib/api/logger";
import { staffInviteSchema } from "@/lib/validations/api";
import { withAuth } from "@/lib/api/with-auth";
import { adminDb } from "@/lib/admin/db";

export const POST = withAuth(
  async (request: NextRequest, { user, supabase }) => {
    try {
      const adminClient = adminDb();
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

      // Run all three validation queries in parallel instead of sequentially.
      // Previously: 3 round-trips × ~150ms = ~450ms sequential.
      // Now: 1 parallel batch = ~150ms total.
      const [memberRes, planLimitRes, staffCountRes] = await Promise.all([
        supabase
          .from("shop_members")
          .select("role")
          .eq("shop_id", input.shop_id)
          .eq("user_id", user.id)
          .single(),
        // Resolve the live plan limit from subscription_plans via the user's
        // active subscription — not the hardcoded getLimits() map.
        // Use adminClient to bypass RLS on the subscriptions table.
        adminClient
          .from("subscriptions")
          .select("subscription_plans(max_staff_per_shop)")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("shop_members")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", input.shop_id)
          .eq("role", "staff"),
      ]);

      if (
        memberRes.error ||
        !memberRes.data ||
        memberRes.data.role !== "owner"
      ) {
        return NextResponse.json(
          { error: "Only shop owners can create staff accounts" },
          { status: 403 },
        );
      }

      const planData = (
        planLimitRes.data as unknown as {
          subscription_plans: { max_staff_per_shop: number } | null;
        } | null
      )?.subscription_plans;
      const maxStaff = planData?.max_staff_per_shop ?? 3;
      const currentStaff = (staffCountRes.count as number | null) ?? 0;
      if (currentStaff >= maxStaff) {
        return NextResponse.json(
          {
            error: `Staff limit reached. Your plan allows ${maxStaff} staff member${maxStaff !== 1 ? "s" : ""}.`,
          },
          { status: 403 },
        );
      }

      const createResult = await Promise.race([
        adminClient.auth.admin.createUser({
          email: input.email,
          password: input.password,
          email_confirm: true,
          user_metadata: { full_name: input.full_name },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("create_timeout")), 8000),
        ),
      ]).catch((err: unknown) => {
        if (err instanceof Error && err.message === "create_timeout") {
          return { data: null, error: { message: "create_timeout" } };
        }
        return { data: null, error: { message: String(err) } };
      });

      if (
        createResult.error &&
        "message" in createResult.error &&
        createResult.error.message === "create_timeout"
      ) {
        console.error("[create-staff] auth.admin.createUser timed out");
        return NextResponse.json(
          { error: "Supabase took too long to respond. Try again." },
          { status: 504 },
        );
      }

      const { data: newUser, error: createError } = createResult;

      const alreadyExists =
        createError?.message
          ?.toLowerCase()
          .includes("already been registered") ||
        createError?.message?.toLowerCase().includes("already exists");

      if (alreadyExists) {
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

      // Run both DB writes in parallel — profile + shop membership.
      // Previously sequential: 2 × ~150ms = ~300ms. Now: ~150ms.
      const [, memberUpsertErr] = await Promise.all([
        adminClient.from("profiles").upsert({
          id: staffUserId,
          full_name: input.full_name,
          role: "staff",
          shop_id: input.shop_id,
        }),
        adminClient
          .from("shop_members")
          .upsert({
            shop_id: input.shop_id,
            user_id: staffUserId,
            role: "staff",
          })
          .then((r) => r.error),
      ]);

      if (memberUpsertErr) {
        const { message, status } = sanitizeError(memberUpsertErr, {
          log: (e) =>
            console.error("[create-staff] shop_members upsert failed:", e),
          fallback:
            "Account created but could not be added to shop. Contact support.",
        });
        return NextResponse.json({ error: message }, { status });
      }

      return NextResponse.json({ ok: true, created: true, invited: false });
    } catch (err) {
      const { message, status } = sanitizeError(err, {
        log: (e) => console.error("[create-staff] unexpected error:", e),
      });
      return NextResponse.json({ error: message }, { status });
    }
  },
);
