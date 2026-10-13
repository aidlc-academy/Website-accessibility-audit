-- AccessLens Supabase Schema Migration v1
-- Run this in your Supabase SQL Editor after creating a new project

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

-- Enable Row Level Security (RLS)
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- IMPORTANT: These policies DENY all direct public/browser access
-- Only the backend service role key can access this table

-- Deny all direct access from anon users (browser clients)
CREATE POLICY "Deny all access to anonymous users"
  ON public.audits
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Deny all direct access from authenticated users (if auth is added later)
CREATE POLICY "Deny all access to authenticated users"
  ON public.audits
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Allow service role full access (backend only)
-- Note: The service role key automatically bypasses RLS, but we document this for clarity

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.audits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add comment explaining backend-only access
COMMENT ON TABLE public.audits IS 'AccessLens audit records. Access restricted to backend service role only. Direct browser/public access is denied via RLS policies.';
