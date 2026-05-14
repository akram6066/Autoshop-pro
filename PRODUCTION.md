# Production Readiness & Security Guide

This document outlines the hardening steps, checklists, and strategies for a secure public production deployment of AutoShop Pro.

## 1. Security Hardening Checklist

### Vercel / Infrastructure

- [ ] **Environment Variables:**
  - Verify `SUPABASE_SERVICE_ROLE_KEY` is NOT prefixed with `NEXT_PUBLIC_`.
  - Use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) with "Production" environment scope only for secrets.
  - Enable "Automatically decrypt Environment Variables" for Vercel CLI.
- [ ] **Deployment Protection:**
  - Enable [Vercel Deployment Protection](https://vercel.com/docs/security/deployment-protection) (Password/SSO) for Preview deployments.
- [ ] **Secure Cookies:**
  - Middleware is configured to use `HttpOnly`, `Secure`, and `SameSite=Lax` (handled by Supabase SSR but verified).
- [ ] **Custom Domain:**
  - Ensure SSL/TLS is handled by Vercel (automatic).

### Supabase / Database

- [ ] **RLS Audit:**
  - Run `SELECT * FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;` to ensure NO tables have RLS disabled.
- [ ] **Vault for Secrets:**
  - Store sensitive integration keys in [Supabase Vault](https://supabase.com/docs/guides/database/vault).
- [ ] **PITR (Point-in-Time Recovery):**
  - Enable PITR in Supabase dashboard (requires Pro plan) for a < 2min RPO (Recovery Point Objective).
- [ ] **Network Restrictions:**
  - (Optional) Restrict DB access to Vercel's IP ranges (if using a fixed egress proxy) or use SSL-only connections.

### Application Security

- [ ] **CSP Headers:**
  - Middleware currently implements a strict Content Security Policy with nonces. Verify that third-party scripts (Sentry, Analytics) are whitelisted.
- [ ] **Rate Limiting:**
  - Verify `enforceRateLimit` is active on all `api/admin/*` and mutation routes.
- [ ] **Dependency Audit:**
  - Run `npm audit` and fix any high/critical vulnerabilities.

## 2. Production Readiness Checklist

### Monitoring & Reliability

- [ ] **Sentry Alerts:** Configure "Issue Alerts" for any error with > 50 occurrences/hour.
- [ ] **Log Drains:** Set up a Vercel Log Drain to Axiom/Datadog for long-term retention of `audit_logs`.
- [ ] **Uptime Monitoring:** Set up BetterStack or Pingdom to monitor the `/api/health` endpoint.

### Performance

- [ ] **DB Indexes:** Verify all `shop_id` and `created_at` columns have b-tree indexes.
- [ ] **Edge Functions:** Use Supabase Edge Functions for compute-heavy background tasks to avoid Vercel Serverless timeouts (10s on Hobby, 60s on Pro).

### Disaster Recovery

- [ ] **Backups:** Verify Supabase automated backups are successful.
- [ ] **DR Plan:**
  - Document the process for rotating `SUPABASE_SERVICE_ROLE_KEY` in case of a leak.
  - Maintain a "Read-Only" mode toggle in environment variables to freeze mutations during maintenance.

## 3. Recommended Strategies

### Cloudflare / WAF

While Vercel has built-in DDoS protection, placing Cloudflare in front is recommended for:

- **Bot Management:** Blocking automated scanners.
- **WAF Rules:** Blocking SQLi and XSS at the edge.
- **Custom Page Rules:** For aggressive caching of static assets.

### Secret Rotation Strategy

1. **Frequency:** Rotate `SUPABASE_SERVICE_ROLE_KEY` and `NEXTAUTH_SECRET` (if used) every 90 days.
2. **Procedure:**
   - Add "New Key" as an additional env var in Vercel.
   - Update code to accept both keys during the transition window.
   - Remove "Old Key" once the deployment is stable.

### Environment Separation

- **Staging:** A separate Supabase project linked to the `develop` branch.
- **Production:** A dedicated "Pro" Supabase project linked to the `main` branch.
- **NEVER** use the same Supabase project for both staging and production.

## 4. Final Security Verification

Before public launch, execute these manual tests:

1. **Tenant Breakout Test:** Attempt to access `shop_id` A's data using `shop_id` B's JWT.
2. **Anonymous Access Test:** Attempt to call `log_audit_event` without a session.
3. **CSP Test:** Attempt to inject an inline `<script>` tag and verify it is blocked by the browser.
