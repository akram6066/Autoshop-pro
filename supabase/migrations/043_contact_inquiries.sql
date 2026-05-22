BEGIN;

CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL CHECK (char_length(name)    BETWEEN 1 AND 200),
  email       text        NOT NULL CHECK (char_length(email)   BETWEEN 1 AND 254),
  subject     text        NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
  message     text        NOT NULL CHECK (char_length(message) BETWEEN 10 AND 5000),
  status      text        NOT NULL DEFAULT 'new'
                          CHECK (status IN ('new', 'read', 'replied')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for admin queries (newest first, filter by status)
CREATE INDEX contact_inquiries_created_at_idx ON public.contact_inquiries (created_at DESC);
CREATE INDEX contact_inquiries_status_idx     ON public.contact_inquiries (status);

-- Enable RLS — all access goes through the service_role API route only.
-- No anon or authenticated user can read/write directly.
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

COMMIT;
