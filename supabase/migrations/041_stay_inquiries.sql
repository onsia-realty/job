-- Apply manually after 040. No external messages or payment processing.
CREATE TABLE public.stay_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stay_id uuid NOT NULL REFERENCES public.stays(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 1000),
  reply text CHECK (char_length(reply) BETWEEN 1 AND 1000),
  consent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  replied_at timestamptz,
  UNIQUE (stay_id, guest_id),
  CHECK (guest_id <> host_id)
);
CREATE INDEX stay_inquiries_host_created ON public.stay_inquiries(host_id, created_at DESC);
CREATE INDEX stay_inquiries_guest_created ON public.stay_inquiries(guest_id, created_at DESC);
ALTER TABLE public.stay_inquiries ENABLE ROW LEVEL SECURITY;
-- All access goes through authenticated server routes. No browser table access.
REVOKE ALL ON public.stay_inquiries FROM anon, authenticated;
GRANT ALL ON public.stay_inquiries TO service_role;
