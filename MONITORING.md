# Logging & Monitoring Architecture

This project implements an enterprise-grade logging and monitoring strategy combining database audit logs, structured application logging, and external service integration.

## 1. Internal Audit System (Supabase)

### Audit Logs Table (`public.audit_logs`)

Stores high-value events that must be persistent and queryable for business compliance.

- **Automated Triggers:**
  - Product price changes (> 20%) and deletions.
  - Sale deletions (Critical).
  - Customer deletions and large balance adjustments.
  - Shop member role changes and removals.
  - Large stock adjustments (> 100 units).
- **Manual Logging:**
  - Use `logger.audit(supabase, params)` for custom business events.
  - Use `logger.security(supabase, params)` for auth failures and suspicious activity.

### Security Features

- **Idempotency:** All manual audit logs accept a UUID to prevent duplicates during sync.
- **Client IP Capture:** Uses `inet_client_addr()` in PostgreSQL to capture the actual IP of the requester.
- **RLS:** Only Shop Owners can view audit logs for their shop.

## 2. Application Logging (`src/lib/api/logger.ts`)

Structured logging wrapper around `console`, `Sentry`, and `Supabase RPCs`.

- `logger.request()`: Standard request metadata tracking.
- `logger.error()`: Exception tracking with context.
- `logger.suspicious()`: Tracks potential attacks or unauthorized access.
- `logger.audit()`: Business-critical state changes.
- `logger.security()`: Auth failures and rate-limit events.

## 3. External Recommendations

### Sentry (Error & Performance)

- **Current Status:** Integrated via `@sentry/nextjs`.
- **Recommended Actions:**
  - Enable **Session Replay** for debugging complex UI state issues.
  - Set up **Alerting Rules** for "New Issue" and "Critical Error Frequency".
  - Use **Performance Monitoring** to identify slow Supabase RPC calls.

### Vercel Monitoring

- **Runtime Logs:** Use Vercel Log Drain to export logs to Axiom or Datadog for long-term retention.
- **Speed Insights:** Monitor Web Vitals to ensure the POS remains snappy on low-end devices.

### Supabase Logs

- **Postgres Logs:** Monitor for slow queries or lock contention in the Supabase Dashboard.
- **Auth Logs:** Review Supabase Auth logs for brute-force patterns (captured partially in our `audit_logs` but Supabase has the raw data).

### Alerting Strategy

1. **Critical (Slack/PagerDuty):** `SALE_DELETED`, `LARGE_BALANCE_ADJUSTMENT`, `AUTH_FAILURE` (high frequency).
2. **Warning (Sentry/Email):** `PRODUCT_DELETED`, `MEMBER_REMOVED`, `LARGE_STOCK_ADJUSTMENT`.
3. **Info (Dashboard only):** Standard business flow logs.

## 4. Suspicious Activity Tracking

Middleware (`src/middleware.ts`) automatically blocks and logs requests to:

- Sensitive files (`.env`, `.git`).
- Common attack vectors (`/wp-admin`, `/xmlrpc.php`).
- Unauthorized access attempts to administrative routes.
