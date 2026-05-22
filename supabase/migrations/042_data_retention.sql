BEGIN;

-- ============================================================
-- 042_data_retention.sql
--
-- Server-side data retention for three tables that grow
-- unboundedly without pruning:
--
--   audit_logs   — keep 1 year; older rows have no operational
--                  value and may contain PII (ip_address).
--   sync_queue   — keep synced entries for 90 days; they are
--                  already cleared client-side by pruneOldData()
--                  but server rows are never touched.
--   shop_invites — keep expired/rejected invites for 90 days;
--                  after that they serve no purpose and hold
--                  email addresses unnecessarily.
--
-- Implemented as a single SQL function so it can be:
--   1. Called manually:  SELECT public.prune_old_data();
--   2. Scheduled via pg_cron (see section 2 below).
--
-- pg_cron is available on Supabase Pro.
-- To enable: Dashboard → Database → Extensions → pg_cron → Enable
-- ============================================================

-- ─── 1. Cleanup function ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.prune_old_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_deleted   bigint;
  v_queue_deleted   bigint;
  v_invites_deleted bigint;
BEGIN
  -- Audit logs older than 1 year
  DELETE FROM public.audit_logs
  WHERE created_at < now() - interval '1 year';
  GET DIAGNOSTICS v_audit_deleted = ROW_COUNT;

  -- Synced sync_queue entries older than 90 days
  DELETE FROM public.sync_queue
  WHERE status = 'synced'
    AND created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_queue_deleted = ROW_COUNT;

  -- Expired or rejected invites older than 90 days
  DELETE FROM public.shop_invites
  WHERE status IN ('expired', 'rejected')
    AND created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_invites_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'audit_logs_deleted',   v_audit_deleted,
    'sync_queue_deleted',   v_queue_deleted,
    'invites_deleted',      v_invites_deleted,
    'pruned_at',            now()
  );
END;
$$;

-- Only superuser/service_role may call this directly.
REVOKE ALL ON FUNCTION public.prune_old_data() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prune_old_data() FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.prune_old_data() TO service_role;

-- ─── 2. pg_cron schedule (Supabase Pro only) ──────────────────────────────────
-- Uncomment after enabling pg_cron in the Supabase dashboard:
--   Dashboard → Database → Extensions → pg_cron → Enable
--
-- SELECT cron.schedule(
--   'prune-old-data',
--   '0 3 * * 0',   -- every Sunday at 03:00 UTC
--   $$ SELECT public.prune_old_data() $$
-- );
--
-- To verify:  SELECT * FROM cron.job WHERE jobname = 'prune-old-data';
-- To remove:  SELECT cron.unschedule('prune-old-data');

COMMIT;
