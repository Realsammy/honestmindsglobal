-- Add a unique referral id column to thrifts
ALTER TABLE public.thrifts
ADD COLUMN IF NOT EXISTS thrift_referral_id TEXT UNIQUE;

-- Backfill for existing rows (if needed)
UPDATE public.thrifts
SET thrift_referral_id = 'THR-' || substr(md5(random()::text), 1, 8)
WHERE thrift_referral_id IS NULL;
