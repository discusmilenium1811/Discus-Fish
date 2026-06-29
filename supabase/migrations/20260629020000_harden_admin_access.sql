-- Prevent privilege escalation through self-service profile updates.
-- Profile creation is handled by the trusted auth trigger/service role.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;

REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.profiles FROM authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;

-- Keep the existing owner-only SELECT policy. Admin/service operations bypass
-- these client grants through the service role.
