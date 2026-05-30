import { adminDb } from "./db";
import type { ErrorCategory } from "./classify-error";

export type LogLevel = "error" | "warning" | "info";

interface LogOptions {
  category: ErrorCategory;
  level?: LogLevel;
  message: string;
  details?: Record<string, unknown>;
  userId?: string;
  shopId?: string;
  path?: string;
}

export async function logEvent(opts: LogOptions): Promise<void> {
  try {
    await adminDb()
      .from("admin_logs")
      .insert({
        category: opts.category,
        level: opts.level ?? "error",
        message: opts.message.slice(0, 2000),
        details: opts.details ?? null,
        user_id: opts.userId ?? null,
        shop_id: opts.shopId ?? null,
        path: opts.path ?? null,
      });
  } catch (err) {
    console.error("[admin/logger] write failed:", err);
  }
}

export async function logAdminAction(opts: {
  action: string;
  targetUserId: string;
  adminId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  await logEvent({
    category: "user_management",
    level: "info",
    message: `Admin action: ${opts.action} on user ${opts.targetUserId}`,
    details: {
      action: opts.action,
      targetUserId: opts.targetUserId,
      ...opts.details,
    },
    userId: opts.adminId,
  });
}
