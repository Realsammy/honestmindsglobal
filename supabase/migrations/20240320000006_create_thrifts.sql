-- Create enum for thrift status if not exists
DO $$ BEGIN
    CREATE TYPE thrift_status AS ENUM ('active', 'suspended', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for transaction type if not exists
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('wallet_funding', 'thrift_registration', 'weekly_contribution', 'thrift_withdrawal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for transaction status if not exists
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing functions if they exist (to avoid dependency issues)
DROP FUNCTION IF EXISTS public.create_thrift();
DROP FUNCTION IF EXISTS public.process_weekly_deductions();
DROP FUNCTION IF EXISTS public.get_user_thrifts();
DROP FUNCTION IF EXISTS public.get_wallet_balance();
DROP FUNCTION IF EXISTS public.get_transaction_history();
DROP FUNCTION IF EXISTS public.get_all_users_with_thrifts();

-- Create thrifts table if not exists
CREATE TABLE IF NOT EXISTS public.thrifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    status thrift_status DEFAULT 'active',
    weekly_amount DECIMAL(10,2) DEFAULT 2000.00,
    total_contributed DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_contribution_date TIMESTAMPTZ,
    next_contribution_date TIMESTAMPTZ,
    account_id TEXT GENERATED ALWAYS AS ('THR-' || id::text) STORED,
    CONSTRAINT valid_weekly_amount CHECK (weekly_amount >= 2000.00)
);

-- Create wallet table if not exists
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    virtual_account_id TEXT,
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create transactions table if not exists
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    thrift_id UUID REFERENCES public.thrifts(id) ON DELETE SET NULL,
    type transaction_type,
    amount DECIMAL(10,2),
    status transaction_status DEFAULT 'pending',
    reference TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create failed deductions table if not exists
CREATE TABLE IF NOT EXISTS public.failed_deductions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    thrift_id UUID REFERENCES public.thrifts(id) ON DELETE CASCADE,
    amount DECIMAL(10,2),
    attempt_date TIMESTAMPTZ DEFAULT now(),
    status transaction_status DEFAULT 'failed',
    retry_count INTEGER DEFAULT 0,
    last_retry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.thrifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_deductions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own thrifts" ON public.thrifts;
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own failed deductions" ON public.failed_deductions;
DROP POLICY IF EXISTS "Admins can view all thrifts" ON public.thrifts;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all failed deductions" ON public.failed_deductions;

-- Create policies for thrifts table
CREATE POLICY "Users can view own thrifts"
ON public.thrifts FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all thrifts"
ON public.thrifts FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
    )
);

-- Create policies for wallets table
CREATE POLICY "Users can view own wallet"
ON public.wallets FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
ON public.wallets FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
    )
);

-- Create policies for transactions table
CREATE POLICY "Users can view own transactions"
ON public.transactions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
    )
);

-- Create policies for failed deductions table
CREATE POLICY "Users can view own failed deductions"
ON public.failed_deductions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all failed deductions"
ON public.failed_deductions FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
    )
);

-- Create functions
CREATE OR REPLACE FUNCTION public.create_thrift()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_wallet_balance DECIMAL(10,2);
    v_has_primary_thrift BOOLEAN;
    v_thrift_id UUID;
BEGIN
    -- Get user ID
    v_user_id := auth.uid();
    
    -- Check if user exists
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Get wallet balance
    SELECT balance INTO v_wallet_balance
    FROM public.wallets
    WHERE user_id = v_user_id;

    -- Check if user has enough balance
    IF v_wallet_balance < 5000.00 THEN
        RAISE EXCEPTION 'Insufficient wallet balance. Minimum required: ₦5000';
    END IF;

    -- Check if user already has a primary thrift
    SELECT EXISTS (
        SELECT 1 FROM public.thrifts
        WHERE user_id = v_user_id AND is_primary = true
    ) INTO v_has_primary_thrift;

    -- Create new thrift
    INSERT INTO public.thrifts (
        user_id,
        is_primary,
        next_contribution_date
    ) VALUES (
        v_user_id,
        NOT v_has_primary_thrift,
        CASE 
            WHEN EXTRACT(DOW FROM now()) = 6 THEN now() + interval '7 days'
            ELSE date_trunc('week', now()) + interval '6 days'
        END
    ) RETURNING id INTO v_thrift_id;

    -- Deduct registration fee and first week contribution
    UPDATE public.wallets
    SET balance = balance - 5000.00
    WHERE user_id = v_user_id;

    -- Record transaction
    INSERT INTO public.transactions (
        user_id,
        thrift_id,
        type,
        amount,
        status,
        description
    ) VALUES (
        v_user_id,
        v_thrift_id,
        'thrift_registration'::transaction_type,
        5000.00,
        'completed'::transaction_status,
        'Thrift registration fee and first week contribution'
    );

    RETURN v_thrift_id;
END;
$$;

-- Function to process weekly deductions
CREATE OR REPLACE FUNCTION public.process_weekly_deductions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_thrift_id UUID;
    v_wallet_balance DECIMAL(10,2);
    v_weekly_amount DECIMAL(10,2);
BEGIN
    -- Process each active thrift
    FOR v_user_id, v_thrift_id, v_weekly_amount IN
        SELECT t.user_id, t.id, t.weekly_amount
        FROM public.thrifts t
        WHERE t.status = 'active'::thrift_status
        AND t.next_contribution_date <= now()
    LOOP
        -- Get wallet balance
        SELECT balance INTO v_wallet_balance
        FROM public.wallets
        WHERE user_id = v_user_id;

        -- Check if user has enough balance
        IF v_wallet_balance >= v_weekly_amount THEN
            -- Deduct from wallet
            UPDATE public.wallets
            SET balance = balance - v_weekly_amount
            WHERE user_id = v_user_id;

            -- Record transaction
            INSERT INTO public.transactions (
                user_id,
                thrift_id,
                type,
                amount,
                status,
                description
            ) VALUES (
                v_user_id,
                v_thrift_id,
                'weekly_contribution'::transaction_type,
                v_weekly_amount,
                'completed'::transaction_status,
                'Weekly thrift contribution'
            );

            -- Update thrift
            UPDATE public.thrifts
            SET 
                total_contributed = total_contributed + v_weekly_amount,
                last_contribution_date = now(),
                next_contribution_date = next_contribution_date + interval '7 days'
            WHERE id = v_thrift_id;
        ELSE
            -- Record failed deduction
            INSERT INTO public.failed_deductions (
                user_id,
                thrift_id,
                amount,
                status
            ) VALUES (
                v_user_id,
                v_thrift_id,
                v_weekly_amount,
                'failed'::transaction_status
            );
        END IF;
    END LOOP;
END;
$$;

-- Function to get user's thrift accounts
CREATE OR REPLACE FUNCTION public.get_user_thrifts()
RETURNS TABLE (
    id UUID,
    is_primary BOOLEAN,
    status thrift_status,
    weekly_amount DECIMAL(10,2),
    total_contributed DECIMAL(10,2),
    created_at TIMESTAMPTZ,
    last_contribution_date TIMESTAMPTZ,
    next_contribution_date TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        t.id,
        t.is_primary,
        t.status::thrift_status,
        t.weekly_amount,
        t.total_contributed,
        t.created_at,
        t.last_contribution_date,
        t.next_contribution_date
    FROM public.thrifts t
    WHERE t.user_id = auth.uid()
    ORDER BY t.created_at DESC;
$$;

-- Function to get user's wallet balance
CREATE OR REPLACE FUNCTION public.get_wallet_balance()
RETURNS DECIMAL(10,2)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT balance
    FROM public.wallets
    WHERE user_id = auth.uid();
$$;

-- Function to get user's transaction history
CREATE OR REPLACE FUNCTION public.get_transaction_history()
RETURNS TABLE (
    id UUID,
    type transaction_type,
    amount DECIMAL(10,2),
    status transaction_status,
    description TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        t.id,
        t.type::transaction_type,
        t.amount,
        t.status::transaction_status,
        t.description,
        t.created_at
    FROM public.transactions t
    WHERE t.user_id = auth.uid()
    ORDER BY t.created_at DESC;
$$;

-- Function to get all users with their thrift accounts (admin only)
CREATE OR REPLACE FUNCTION public.get_all_users_with_thrifts()
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    thrifts JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH user_thrifts AS (
        SELECT 
            t.user_id,
            jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'is_primary', t.is_primary,
                    'status', t.status,
                    'weekly_amount', t.weekly_amount,
                    'total_contributed', t.total_contributed,
                    'created_at', t.created_at,
                    'last_contribution_date', t.last_contribution_date,
                    'next_contribution_date', t.next_contribution_date
                )
            ) as thrifts
        FROM public.thrifts t
        GROUP BY t.user_id
    )
    SELECT 
        u.id,
        u.email,
        u.raw_user_meta_data->>'full_name' as full_name,
        u.raw_user_meta_data->>'role' as role,
        CASE 
            WHEN u.raw_user_meta_data->>'is_active' = 'true' THEN true
            WHEN u.raw_user_meta_data->>'is_active' = 'false' THEN false
            ELSE true -- Default to true if not set
        END as is_active,
        u.created_at,
        COALESCE(ut.thrifts, '[]'::jsonb) as thrifts
    FROM auth.users u
    LEFT JOIN user_thrifts ut ON u.id = ut.user_id
    WHERE u.raw_user_meta_data->>'role' != 'super_admin'
    ORDER BY u.created_at DESC;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_thrift() TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_weekly_deductions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_thrifts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_wallet_balance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_transaction_history() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_with_thrifts() TO authenticated; 