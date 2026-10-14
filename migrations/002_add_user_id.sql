-- Add user_id column to audits table for authentication
-- Run this after 001_initial_schema.sql

ALTER TABLE public.audits 
ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE INDEX IF NOT EXISTS idx_audits_user_id ON public.audits(user_id);

COMMENT ON COLUMN public.audits.user_id IS 'Owner of this audit (optional for backwards compatibility)';
