-- Add missing columns to thrifts table
ALTER TABLE public.thrifts
ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT 'Thrift Account',
ADD COLUMN IF NOT EXISTS target_amount DECIMAL(10,2) NOT NULL DEFAULT 104000.00,
ADD COLUMN IF NOT EXISTS weekly_amount DECIMAL(10,2) NOT NULL DEFAULT 2000.00,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '52 weeks'),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_eligible_for_foodstuff BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS referral_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_contribution_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_contribution_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS current_week INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS has_defaulted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_weeks INTEGER[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS default_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_withdrawn DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_interest DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_penalty DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referrals_within_40days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_referrals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_purchased_tshirt BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS clearance_fee_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS next_of_kin_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS next_of_kin_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS next_of_kin_relationship VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_deceased BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fast_track_eligible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fast_track_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_default_check TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS consecutive_defaults INTEGER DEFAULT 0;

-- Drop existing constraints if they exist
ALTER TABLE public.thrifts
DROP CONSTRAINT IF EXISTS valid_weekly_amount,
DROP CONSTRAINT IF EXISTS valid_target_amount,
DROP CONSTRAINT IF EXISTS valid_cycle_length;

-- Add constraints
ALTER TABLE public.thrifts
ADD CONSTRAINT valid_weekly_amount CHECK (weekly_amount >= 2000.00),
ADD CONSTRAINT valid_target_amount CHECK (target_amount = weekly_amount * 52),
ADD CONSTRAINT valid_cycle_length CHECK (
  date_trunc('day', end_date) = date_trunc('day', start_date + interval '52 weeks')
);

-- Create next_of_kin table
CREATE TABLE IF NOT EXISTS public.next_of_kin (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS for next_of_kin table
ALTER TABLE public.next_of_kin ENABLE ROW LEVEL SECURITY;

-- Create policy for next_of_kin table
CREATE POLICY "Enable all next_of_kin operations for authenticated users"
ON public.next_of_kin
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.next_of_kin TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create function to check for defaulted payments
CREATE OR REPLACE FUNCTION public.check_thrift_defaults()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_thrift RECORD;
BEGIN
    FOR v_thrift IN
        SELECT *
        FROM public.thrifts
        WHERE status = 'active'
        AND next_contribution_date < now()
        AND last_default_check IS NULL OR last_default_check < now() - interval '1 day'
    LOOP
        -- Update consecutive defaults
        UPDATE public.thrifts
        SET 
            consecutive_defaults = consecutive_defaults + 1,
            has_defaulted = true,
            default_weeks = array_append(default_weeks, v_thrift.current_week),
            default_amount = default_amount + v_thrift.weekly_amount,
            last_default_check = now()
        WHERE id = v_thrift.id;

        -- Suspend account if 4 consecutive defaults
        IF v_thrift.consecutive_defaults >= 3 THEN
            UPDATE public.thrifts
            SET status = 'suspended'
            WHERE id = v_thrift.id;
        END IF;
    END LOOP;
END;
$$;

-- Create function to check fast track eligibility
CREATE OR REPLACE FUNCTION public.check_fast_track_eligibility()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_thrift RECORD;
BEGIN
    FOR v_thrift IN
        SELECT *
        FROM public.thrifts
        WHERE status = 'active'
        AND fast_track_eligible = false
        AND created_at > now() - interval '30 days'
    LOOP
        -- Check if user has 5 referrals within 30 days
        IF (
            SELECT COUNT(*)
            FROM public.thrifts
            WHERE referral_id = v_thrift.user_id
            AND created_at > v_thrift.created_at
            AND created_at < v_thrift.created_at + interval '30 days'
        ) >= 5 THEN
            UPDATE public.thrifts
            SET 
                fast_track_eligible = true,
                fast_track_deadline = v_thrift.created_at + interval '30 days'
            WHERE id = v_thrift.id;
        END IF;
    END LOOP;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_thrift_defaults() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_fast_track_eligibility() TO authenticated; 