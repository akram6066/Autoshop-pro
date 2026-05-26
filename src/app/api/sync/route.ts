import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { logRequest, logger } from "@/lib/api/logger";
import { syncPayloadSchema } from "@/lib/validations/api";
import { withAuth } from "@/lib/api/with-auth";
import { friendlyError } from "@/lib/api/errors";
import type { Json, Database } from "@/types/database";

export const POST = withAuth(
  async (request: NextRequest, { user, supabase }) => {
    logRequest(request, user.id);

    const limited = await enforceRateLimit(
      request,
      { name: "sync", limit: 30, windowSec: 60 },
      user.id,
    );
    if (limited) return limited;

    // Guard against excessively large sync payloads before parsing JSON
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Payload too large (max 2MB)" },
        { status: 413 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const result = syncPayloadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 },
      );
    }

    const { shop_id, commands } = result.data;

    const { data: membership } = await supabase
      .from("shop_members")
      .select("role")
      .eq("shop_id", shop_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const RPC_TIMEOUT_MS = 10_000;

    async function runCommand(
      cmd: (typeof commands)[number],
    ): Promise<{ id: string; success: boolean; error?: string }> {
      const p = cmd.payload;
      let error: string | null = null;

      // supabase.rpc() returns a PromiseLike (thenable), not a true Promise.
      // Promise.resolve() converts it to a real Promise before racing.
      const withTimeout = <T>(thenable: PromiseLike<T>): Promise<T> =>
        Promise.race([
          Promise.resolve(thenable),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("RPC timeout")), RPC_TIMEOUT_MS),
          ),
        ]);

      try {
        if (cmd.command === "RECORD_SALE") {
          const { error: rpcError } = await withTimeout(
            supabase.rpc("record_sale", {
              p_sale: p.sale as Json,
              p_items: p.items as Json,
            }),
          );
          if (rpcError)
            error = friendlyError(rpcError, "Sale could not be recorded");
        } else if (cmd.command === "RECORD_CUSTOMER_PAYMENT") {
          const { error: rpcError } = await withTimeout(
            supabase.rpc("record_customer_payment", {
              p_payment: p.payment as Json,
            }),
          );
          if (rpcError)
            error = friendlyError(rpcError, "Payment could not be recorded");
        } else if (cmd.command === "RECORD_STOCK_MOVEMENT") {
          const { error: rpcError } = await withTimeout(
            supabase.rpc("record_stock_movement", {
              p_movement: p.movement as Json,
            }),
          );
          if (rpcError)
            error = friendlyError(
              rpcError,
              "Stock movement could not be recorded",
            );
        } else if (cmd.command === "MANAGE_PRODUCT") {
          const { error: rpcError } = await withTimeout(
            supabase.rpc("manage_product", {
              p_op: p.op as string,
              p_product: p.product as Json,
            }),
          );
          if (rpcError)
            error = friendlyError(rpcError, "Product operation failed");
        } else if (cmd.command === "MANAGE_CUSTOMER") {
          const { error: rpcError } = await withTimeout(
            supabase.rpc("manage_customer", {
              p_op: p.op as string,
              p_customer: p.customer as Json,
            }),
          );
          if (rpcError)
            error = friendlyError(rpcError, "Customer operation failed");
        } else if (cmd.command === "CREATE_VARIANTS") {
          type VariantInsert =
            Database["public"]["Tables"]["product_variants"]["Insert"];
          const variants = p.variants as unknown as VariantInsert[];
          const { error: insertError } = await withTimeout(
            supabase.from("product_variants").insert(variants),
          );
          if (insertError)
            error = friendlyError(insertError, "Variants could not be saved");
        } else {
          error = `Unknown command: ${cmd.command}`;
        }
      } catch (err) {
        error = friendlyError(err, "Internal server error");
        logger.error("Sync command failed", err, {
          command: cmd.command,
          shop_id,
        });
      }

      return { id: cmd.id, success: !error, error: error ?? undefined };
    }

    // Run commands strictly in order — a RECORD_SALE that sells a product
    // created offline in the same batch must not race with MANAGE_PRODUCT.
    // If one command fails, we continue (the client handles individual failures)
    // so a bad sale doesn't block a product update queued after it.
    const results: Array<{ id: string; success: boolean; error?: string }> = [];
    for (const cmd of commands) {
      results.push(await runCommand(cmd));
    }

    if (commands.some((c) => c.command === "RECORD_SALE")) {
      void supabase.rpc("refresh_sales_summary").then(
        () => {},
        () => {},
      );
    }

    return NextResponse.json({
      ok: true,
      server_time: new Date().toISOString(),
      results,
    });
  },
);
