BEGIN;

-- ============================================================
-- 20260606120000_portable_cron.sql
--
-- Makes all three scheduled jobs host-agnostic so the app can
-- run on any server (Railway, Fly.io, Docker, VPS, etc.),
-- not only Vercel.
--
-- Context:
--   expire_stale_subscriptions — already in pg_cron (migration 058)
--   prune_old_data             — already in pg_cron (migration 063)
--   trigger-trial-billing      — was Vercel-cron only; moved here
--
-- trigger-trial-billing calls the /api/admin/trigger-trial-billing
-- HTTP endpoint via pg_net (Supabase Pro) so M-Pesa STK pushes
-- still originate from the app server where credentials live.
--
-- Setup required after deployment (run once via Supabase dashboard
-- or psql):
--
--   UPDATE public.app_settings
--   SET value = '"https://your-app-domain.com"'
--   WHERE key = 'app_url';
--
--   UPDATE public.app_settings
--   SET value = to_jsonb(current_setting('app.cron_secret'))
--   WHERE key = 'cron_secret';
--
-- Or insert directly:
--   INSERT INTO public.app_settings (key, value)
--   VALUES ('app_url',    '"https://your-app-domain.com"'),
--          ('cron_secret', '"your-cron-secret-here"')
--   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
-- ============================================================


-- ─── 1. Seed placeholder rows so the cron job can read them ──────────────────
-- ON CONFLICT DO NOTHING: never overwrite values an admin already set.

INSERT INTO public.app_settings (key, value)
VALUES
  ('app_url',     '"https://your-app-domain.com"'),
  ('cron_secret', '"change-me"')
ON CONFLICT (key) DO NOTHING;


-- ─── 2. Schedule trigger-trial-billing via pg_net ────────────────────────────
-- Requires pg_net extension (enabled on Supabase Pro).
-- Reads app_url and cron_secret from app_settings at job run-time,
-- so updating those rows is enough to change the target URL or secret.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
  AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN

    PERFORM cron.unschedule('trigger-trial-billing');

    PERFORM cron.schedule(
      'trigger-trial-billing',
      '0 6 * * *',   -- 06:00 UTC daily, same as vercel.json
      $job$
        SELECT net.http_post(
          url     := (
            SELECT value #>> '{}'
            FROM   public.app_settings
            WHERE  key = 'app_url'
          ) || '/api/admin/trigger-trial-billing',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', (
              SELECT value #>> '{}'
              FROM   public.app_settings
              WHERE  key = 'cron_secret'
            )
          ),
          body    := '{}'::jsonb
        )
      $job$
    );

  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron / pg_net not available on this Supabase tier — silently skip.
  -- On Free plan the Vercel cron (vercel.json) or an external scheduler
  -- must be used instead.
  NULL;
END $$;

COMMIT;
