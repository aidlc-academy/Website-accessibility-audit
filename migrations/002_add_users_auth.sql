-- AccessLens backend-managed user accounts.
-- Run this after 001_initial_schema.sql. The app authenticates in Express,
-- so user records and password hashes are never exposed to browser clients.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) > 0),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Add user_id to audits table to associate audits with users
ALTER TABLE public.audits 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_audits_user_id ON public.audits(user_id);

-- Custom application JWTs are verified by Express, not Supabase Auth. Keep
-- both tables backend-only rather than granting misleading client-side access.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deny all access to anonymous users" ON public.users;
CREATE POLICY "Deny all access to anonymous users"
  ON public.users
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Deny all access to anonymous users" ON public.audits;
DROP POLICY IF EXISTS "Deny all access to authenticated users" ON public.audits;
CREATE POLICY "Deny all access to anonymous users"
  ON public.audits
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
CREATE POLICY "Deny all access to authenticated users"
  ON public.audits
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Deny all access to authenticated users" ON public.users;
CREATE POLICY "Deny all access to authenticated users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

DROP TRIGGER IF EXISTS set_updated_at_users ON public.users;
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add comments
COMMENT ON TABLE public.users IS 'AccessLens accounts. Password hashes are accessible only to the backend service role.';
COMMENT ON COLUMN public.audits.user_id IS 'Owner of this audit record';
