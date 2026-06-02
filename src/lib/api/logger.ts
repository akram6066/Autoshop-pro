import type { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";

type LogSeverity = "info" | "warning" | "error" | "critical";

interface AuditParams {
  shop_id?: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  severity?: LogSeverity;
}

interface SecurityParams {
  event_type: "AUTH_FAILURE" | "SUSPICIOUS_REQUEST" | "RATE_LIMIT_EXCEEDED";
  payload: Record<string, unknown>;
  severity?: LogSeverity;
}

/**
 * Enterprise Logger Utility
 * Handles console output, Sentry reporting, and DB audit logging.
 */
export const logger = {
  /**
   * Log standard request metadata
   */
  request(req: NextRequest, userId?: string) {
    const now = new Date().toISOString();
    const method = req.method;
    const url = req.nextUrl.pathname;
    const _ua = req.headers.get("user-agent") || "unknown";
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    console.info(
      `[${now}] ${method} ${url} - User: ${userId || "guest"} - IP: ${ip}`,
    );

    Sentry.setTag("url", url);
    Sentry.setTag("method", method);
    if (userId) Sentry.setUser({ id: userId });
  },

  /**
   * Log an error and report to Sentry
   */
  error(msg: string, error: unknown, context?: Record<string, unknown>) {
    console.error(`[ERROR] ${msg}`, error, context);
    Sentry.captureException(error, {
      extra: { message: msg, ...context },
    });
  },

  /**
   * Capture suspicious activity and log to both Sentry and DB
   */
  async suspicious(
    supabase: unknown,
    msg: string,
    context: Record<string, unknown>,
  ) {
    console.warn(`[SUSPICIOUS] ${msg}`, context);

    // 1. Sentry
    Sentry.captureMessage(`Suspicious Activity: ${msg}`, {
      level: "warning",
      extra: context,
    });

    // 2. DB Audit (if supabase instance provided)
    if (supabase) {
      await this.security(supabase, {
        event_type: "SUSPICIOUS_REQUEST",
        payload: { message: msg, ...context },
        severity: "warning",
      });
    }
  },

  /**
   * Persist a high-value audit event to the database
   */
  async audit(supabase: unknown, params: AuditParams) {
    if (!supabase) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("log_audit_event", {
      p_shop_id: params.shop_id,
      p_event_type: params.event_type,
      p_entity_type: params.entity_type,
      p_entity_id: params.entity_id,
      p_payload: params.payload,
      p_severity: params.severity || "info",
    });

    if (error) {
      this.error(
        "Failed to persist audit log",
        error,
        params as unknown as Record<string, unknown>,
      );
    }
  },

  /**
   * Persist a security event (can be anonymous)
   */
  async security(supabase: unknown, params: SecurityParams) {
    if (!supabase) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("log_security_event", {
      p_event_type: params.event_type,
      p_payload: params.payload,
      p_severity: params.severity || "warning",
    });

    if (error) {
      this.error(
        "Failed to persist security event",
        error,
        params as unknown as Record<string, unknown>,
      );
    }
  },
};

// Maintain compatibility with existing code
export const logRequest = logger.request.bind(logger);
