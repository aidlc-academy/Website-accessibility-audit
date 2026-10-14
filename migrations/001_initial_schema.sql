-- AccessLens audit schema.
-- Run this first in the Supabase SQL Editor for a new project.

-- Create audits table with JSONB for flexible issue storage
CREATE TABLE IF NOT EXISTS public.audits (
  id UUID PRIMARY KEY,
  success BOOLEAN NOT NULL DEFAULT true,
  url TEXT NOT NULL,
  page_title TEXT,
  page_load_error TEXT,
  scanned_at TIMESTAMPTZ NOT NULL,
  axe_version TEXT NOT NULL,
  scan_configuration JSONB NOT NULL,
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  passed_rules INTEGER NOT NULL DEFAULT 0,
  incomplete_rules INTEGER NOT NULL DEFAULT 0,
  violation_count INTEGER NOT NULL DEFAULT 0,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'completed',
  standard TEXT NOT NULL,
  viewport TEXT NOT NULL,
  manual_review_required BOOLEAN NOT NULL DEFAULT true,
  report_filename TEXT,
  compare_to_audit_id UUID REFERENCES public.audits(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_audits_scanned_at ON public.audits(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_audits_url ON public.audits(url);
CREATE INDEX IF NOT EXISTS idx_audits_status ON public.audits(status);
CREATE INDEX IF NOT EXISTS idx_audits_compare_to ON public.audits(compare_to_audit_id) WHERE compare_to_audit_id IS NOT NULL;

-- The Express backend uses the service-role key. Browser clients must not access
-- audit data directly; RLS also denies access if a public key is used by mistake.
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all access to anonymous users" ON public.audits;
CREATE POLICY "Deny all access to anonymous users"
  ON public.audits
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Deny all access to authenticated users" ON public.audits;
CREATE POLICY "Deny all access to authenticated users"
  ON public.audits
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.audits;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.audits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.audits IS 'AccessLens audit records. Access is restricted to the backend service role; direct browser access is denied by RLS.';
