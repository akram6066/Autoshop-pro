BEGIN;

-- Add admin flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Admin logs table — stores classified app events
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category    text        NOT NULL DEFAULT 'other'
                          CHECK (category IN (
                            'api', 'database', 'frontend',
                            'shop_management', 'user_management', 'other'
                          )),
  level       text        NOT NULL DEFAULT 'error'
                          CHECK (level IN ('error', 'warning', 'info')),
  message     text        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  details     jsonb,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  shop_id     uuid        REFERENCES public.shops(id) ON DELETE SET NULL,
  path        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_logs_created_at_idx ON public.admin_logs (created_at DESC);
CREATE INDEX admin_logs_category_idx   ON public.admin_logs (category);
CREATE INDEX admin_logs_level_idx      ON public.admin_logs (level);
CREATE INDEX admin_logs_user_id_idx    ON public.admin_logs (user_id);

-- Only service_role can access logs — no public policies
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

COMMIT;
