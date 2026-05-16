import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { logRequest, logger } from "@/lib/api/logger";
import { syncPayloadSchema } from "@/lib/validations/api";
import { withAuth } from "@/lib/api/with-auth";
import type { Json } from "@/types/database";

export const POST = withAuth(
  async (request: NextRequest, { user, supabase }) => {
    logRequest(request, user.id);

    const limited = await enforceRateLimit(
      request,
      { name: "sync", limit: 30, windowSec: 60 },
      user.id,
    );
    if (limited) return limited;

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

    const RPC_TIMEOUT_MS = 10_000;
    const CONCURRENCY = 5;

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
          if (rpcError) error = rpcError.message;
        } else if (cmd.command === "RECORD_CUSTOMER_PAYMENT") {
          const { error: rpcError } = await withTimeout(
            supabase.rpc("record_customer_payment", {
              p_payment: p.payment as Json,
            }),
          );
          if (rpcError) error = rpcError.message;
        } else if (cmd.command === "RECORD_STOCK_MOVEMENT") {
          const { error: rpcError } = await withTimeout(
            supabase.rpc("record_stock_movement", {
              p_movement: p.movement as Json,
            }),
          );
          if (rpcError) error = rpcError.message;
        } else if (cmd.command === "MANAGE_PRODUCT") {
          const { error: rpcError } = await withTimeout(
            supabase.rpc("manage_product", {
              p_op: p.op as string,
              p_product: p.product as Json,
            }),
          );
          if (rpcError) error = rpcError.message;
        } else if (cmd.command === "MANAGE_CUSTOMER") {
          const { error: rpcError } = await withTimeout(
            supabase.rpc("manage_customer", {
              p_op: p.op as string,
              p_customer: p.customer as Json,
            }),
          );
          if (rpcError) error = rpcError.message;
        } else {
          error = `Unknown command: ${cmd.command}`;
        }
      } catch (err) {
        error = err instanceof Error ? err.message : "Internal server error";
        logger.error("Sync command failed", err, {
          command: cmd.command,
          shop_id,
        });
      }

      return { id: cmd.id, success: !error, error: error ?? undefined };
    }

    // Run commands in parallel batches — CONCURRENCY at a time
    const results: Array<{ id: string; success: boolean; error?: string }> = [];
    for (let i = 0; i < commands.length; i += CONCURRENCY) {
      const batch = commands.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(batch.map(runCommand));
      results.push(...batchResults);
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
