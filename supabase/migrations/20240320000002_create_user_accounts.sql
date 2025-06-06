-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can insert their own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can update their own referrals" ON public.referrals;

-- Create user_accounts table
CREATE TABLE IF NOT EXISTS public.user_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id VARCHAR(20) UNIQUE NOT NULL,
    account_type VARCHAR(20) NOT NULL DEFAULT 'primary',
    wallet_balance DECIMAL(12,2) DEFAULT 0.00,
    referral_id VARCHAR(20) UNIQUE NOT NULL,
    total_referrals INTEGER DEFAULT 0,
    referrals_within_40days INTEGER DEFAULT 0,
    active_referrals INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create referrals table to track referral relationships
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(referred_id)
);

-- Enable RLS
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create policies for user_accounts
CREATE POLICY "Users can view their own accounts"
    ON public.user_accounts
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
    ON public.user_accounts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
    ON public.user_accounts
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policies for referrals
CREATE POLICY "Users can view their own referrals"
    ON public.referrals
    FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can insert their own referrals"
    ON public.referrals
    FOR INSERT
    WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update their own referrals"
    ON public.referrals
    FOR UPDATE
    USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON public.user_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_account_id ON public.user_accounts(account_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_referral_id ON public.user_accounts(referral_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);

-- Function to generate unique account ID with HMGV prefix
CREATE OR REPLACE FUNCTION generate_account_id()
RETURNS TRIGGER AS $$
DECLARE
    new_account_id VARCHAR(20);
BEGIN
    -- Generate a unique account ID (HMGV + random numbers)
    LOOP
        new_account_id := 'HMGV' || floor(random() * 1000000000000)::text;
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user_accounts WHERE account_id = new_account_id);
    END LOOP;
    
    NEW.account_id := new_account_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique referral ID
CREATE OR REPLACE FUNCTION generate_referral_id()
RETURNS TRIGGER AS $$
DECLARE
    new_referral_id VARCHAR(20);
BEGIN
    -- Generate a unique referral ID (HMGV + random alphanumeric)
    LOOP
        new_referral_id := 'HMGV' || substr(md5(random()::text), 1, 10);
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user_accounts WHERE referral_id = new_referral_id);
    END LOOP;
    
    NEW.referral_id := new_referral_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update referral counts
CREATE OR REPLACE FUNCTION update_referral_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total referrals
    UPDATE public.user_accounts
    SET total_referrals = (
        SELECT COUNT(*) 
        FROM public.referrals 
        WHERE referrer_id = NEW.referrer_id
    )
    WHERE user_id = NEW.referrer_id;

    -- Update referrals within 40 days
    UPDATE public.user_accounts
    SET referrals_within_40days = (
        SELECT COUNT(*) 
        FROM public.referrals 
        WHERE referrer_id = NEW.referrer_id
        AND created_at >= NOW() - INTERVAL '40 days'
    )
    WHERE user_id = NEW.referrer_id;

    -- Update active referrals
    UPDATE public.user_accounts
    SET active_referrals = (
        SELECT COUNT(*) 
        FROM public.referrals 
        WHERE referrer_id = NEW.referrer_id
        AND status = 'active'
    )
    WHERE user_id = NEW.referrer_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_account_id ON public.user_accounts;
DROP TRIGGER IF EXISTS set_referral_id ON public.user_accounts;
DROP TRIGGER IF EXISTS update_referral_counts_trigger ON public.referrals;

-- Create triggers
CREATE TRIGGER set_account_id
    BEFORE INSERT ON public.user_accounts
    FOR EACH ROW
    EXECUTE FUNCTION generate_account_id();

CREATE TRIGGER set_referral_id
    BEFORE INSERT ON public.user_accounts
    FOR EACH ROW
    EXECUTE FUNCTION generate_referral_id();

CREATE TRIGGER update_referral_counts_trigger
    AFTER INSERT OR UPDATE ON public.referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_referral_counts(); 