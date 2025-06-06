-- Update thrifts table to support new account creation flow
ALTER TABLE thrifts
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS referral_id UUID REFERENCES auth.users,
ADD COLUMN IF NOT EXISTS account_id TEXT GENERATED ALWAYS AS ('THR-' || id::text) STORED,
ADD COLUMN IF NOT EXISTS is_eligible_for_foodstuff BOOLEAN DEFAULT false;

-- Create wallets table if not exists
CREATE TABLE IF NOT EXISTS wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create transactions table if not exists
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    thrift_id UUID REFERENCES thrifts(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    reference TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON transactions;

-- Create policies for wallets
CREATE POLICY "Users can view own wallet"
ON wallets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
ON wallets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create policies for transactions
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_wallet_balance();
DROP FUNCTION IF EXISTS get_transaction_history();
DROP FUNCTION IF EXISTS get_user_thrifts();

-- Create function to get user's wallet balance
CREATE OR REPLACE FUNCTION get_wallet_balance()
RETURNS DECIMAL(10,2)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT balance
    FROM wallets
    WHERE user_id = auth.uid();
$$;

-- Create function to get user's transaction history
CREATE OR REPLACE FUNCTION get_transaction_history()
RETURNS TABLE (
    id UUID,
    type TEXT,
    amount DECIMAL(10,2),
    status TEXT,
    description TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        t.id,
        t.type,
        t.amount,
        t.status,
        t.description,
        t.created_at
    FROM transactions t
    WHERE t.user_id = auth.uid()
    ORDER BY t.created_at DESC;
$$;

-- Create function to get user's thrift accounts
CREATE OR REPLACE FUNCTION get_user_thrifts()
RETURNS TABLE (
    id UUID,
    account_id TEXT,
    is_primary BOOLEAN,
    status TEXT,
    weekly_amount DECIMAL(10,2),
    total_contributed DECIMAL(10,2),
    created_at TIMESTAMPTZ,
    last_contribution_date TIMESTAMPTZ,
    next_contribution_date TIMESTAMPTZ,
    is_eligible_for_foodstuff BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        t.id,
        t.account_id,
        t.is_primary,
        t.status,
        t.weekly_amount,
        t.total_contributed,
        t.created_at,
        t.last_contribution_date,
        t.next_contribution_date,
        t.is_eligible_for_foodstuff
    FROM thrifts t
    WHERE t.user_id = auth.uid()
    ORDER BY t.created_at DESC;
$$; 