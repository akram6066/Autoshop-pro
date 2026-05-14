import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { logRequest, logger } from "@/lib/api/logger";
import { syncPayloadSchema } from "@/lib/validations/api";
import type { Json } from "@/types/database";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const results: Array<{ id: string; success: boolean; error?: string }> = [];

  // Execute commands in strict order
  for (const cmd of commands) {
    let error: string | null = null;
    const p = cmd.payload;

    try {
      if (cmd.command === "RECORD_SALE") {
        const { error: rpcError } = await supabase.rpc("record_sale", {
          p_sale: p.sale as Json,
          p_items: p.items as Json,
        });
        if (rpcError) error = rpcError.message;
      } else if (cmd.command === "RECORD_CUSTOMER_PAYMENT") {
        const { error: rpcError } = await supabase.rpc(
          "record_customer_payment",
          {
            p_payment: p.payment as Json,
          },
        );
        if (rpcError) error = rpcError.message;
      } else if (cmd.command === "RECORD_STOCK_MOVEMENT") {
        const { error: rpcError } = await supabase.rpc(
          "record_stock_movement",
          {
            p_movement: p.movement as Json,
          },
        );
        if (rpcError) error = rpcError.message;
      } else if (cmd.command === "MANAGE_PRODUCT") {
        const { error: rpcError } = await supabase.rpc("manage_product", {
          p_op: p.op as string,
          p_product: p.product as Json,
        });
        if (rpcError) error = rpcError.message;
      } else if (cmd.command === "MANAGE_CUSTOMER") {
        const { error: rpcError } = await supabase.rpc("manage_customer", {
          p_op: p.op as string,
          p_customer: p.customer as Json,
        });
        if (rpcError) error = rpcError.message;
      } else {
        error = `Unknown command: ${cmd.command}`;
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Internal server error";
      error = message;
      logger.error("Sync command failed", err, {
        command: cmd.command,
        shop_id,
      });
    }

    results.push({
      id: cmd.id,
      success: !error,
      error: error ?? undefined,
    });
  }

  // Background refresh of materialized view if any sales were recorded
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
}
