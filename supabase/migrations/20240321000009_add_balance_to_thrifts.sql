-- Add balance column to thrifts table
ALTER TABLE public.thrifts
ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00;

-- Add current_week column if not exists
ALTER TABLE public.thrifts
ADD COLUMN IF NOT EXISTS current_week INTEGER DEFAULT 1;

-- Add has_defaulted column if not exists
ALTER TABLE public.thrifts
ADD COLUMN IF NOT EXISTS has_defaulted BOOLEAN DEFAULT false;

-- Add default_weeks column if not exists
ALTER TABLE public.thrifts
ADD COLUMN IF NOT EXISTS default_weeks INTEGER[] DEFAULT '{}';

-- Add default_amount column if not exists
ALTER TABLE public.thrifts
ADD COLUMN IF NOT EXISTS default_amount DECIMAL(10,2) DEFAULT 0.00;

-- Add is_paid column if not exists
ALTER TABLE public.thrifts
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false; 