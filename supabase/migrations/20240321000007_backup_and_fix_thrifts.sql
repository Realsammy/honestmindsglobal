-- Create backup table
CREATE TABLE IF NOT EXISTS public.thrifts_backup AS 
SELECT * FROM public.thrifts;

-- Drop existing thrifts table
DROP TABLE IF EXISTS public.thrifts CASCADE;

-- Create thrifts table with all required columns
CREATE TABLE public.thrifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    account_id TEXT GENERATED ALWAYS AS ('THR-' || id::text) STORED,
    target_amount DECIMAL(10,2) NOT NULL,
    weekly_amount DECIMAL(10,2) NOT NULL,
    total_contributed DECIMAL(10,2) DEFAULT 0.00,
    start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    is_primary BOOLEAN DEFAULT false,
    is_eligible_for_foodstuff BOOLEAN DEFAULT false,
    referral_id UUID REFERENCES auth.users(id),
    last_contribution_date TIMESTAMPTZ,
    next_contribution_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Restore data from backup (excluding account_id since it's generated)
INSERT INTO public.thrifts (
    id, user_id, name, target_amount, weekly_amount, 
    total_contributed, start_date, end_date, status,
    is_primary, is_eligible_for_foodstuff, referral_id,
    last_contribution_date, next_contribution_date,
    created_at, updated_at
)
SELECT 
    id, user_id, 
    COALESCE(name, 'Thrift Account ' || id::text), -- Provide default name if null
    COALESCE(target_amount, weekly_amount * 52), -- Calculate target from weekly if null
    COALESCE(weekly_amount, 2000.00), -- Default weekly amount if null
    COALESCE(total_contributed, 0.00),
    COALESCE(start_date, now()),
    COALESCE(end_date, now() + interval '52 weeks'),
    COALESCE(status, 'active'),
    COALESCE(is_primary, false),
    COALESCE(is_eligible_for_foodstuff, false),
    referral_id,
    last_contribution_date,
    next_contribution_date,
    COALESCE(created_at, now()),
    COALESCE(updated_at, now())
FROM public.thrifts_backup;

-- Drop backup table
DROP TABLE IF EXISTS public.thrifts_backup;

-- Enable RLS
ALTER TABLE public.thrifts ENABLE ROW LEVEL SECURITY;

-- Create policy for thrifts table
CREATE POLICY "Enable all thrift operations for authenticated users"
ON public.thrifts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.thrifts TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 