-- Drop existing tables and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.virtual_accounts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create a basic profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    referral_code TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create virtual_accounts table
CREATE TABLE public.virtual_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_number TEXT,
    bank_name TEXT,
    tx_ref TEXT,
    flw_ref TEXT,
    order_ref TEXT,
    bvn TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_profile_id ON public.virtual_accounts(profile_id);

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    referral_code TEXT;
BEGIN
    -- Log the start of the function
    RAISE LOG 'Starting handle_new_user for user %', NEW.id;
    
    -- Generate referral code
    referral_code := UPPER(SUBSTRING(NEW.id::text, 1, 4) || SUBSTRING(MD5(RANDOM()::text), 1, 4));
    RAISE LOG 'Generated referral code: %', referral_code;
    
    -- Create profile
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone,
        avatar_url,
        referral_code,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        referral_code,
        NOW(),
        NOW()
    );
    
    RAISE LOG 'Successfully created profile for user %', NEW.id;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        -- Re-raise the error
        RAISE;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.virtual_accounts TO authenticated;
GRANT ALL ON public.virtual_accounts TO service_role;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.virtual_accounts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.virtual_accounts;
DROP POLICY IF EXISTS "Enable update for users based on profile_id" ON public.virtual_accounts;
DROP POLICY IF EXISTS "Service role can do everything" ON public.profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON public.virtual_accounts;

-- Create basic policies
CREATE POLICY "Enable read access for authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Virtual accounts policies
CREATE POLICY "Enable read access for authenticated users"
ON public.virtual_accounts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.virtual_accounts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Enable update for users based on profile_id"
ON public.virtual_accounts FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id);

-- Service role policies
CREATE POLICY "Service role can do everything"
ON public.profiles
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can do everything"
ON public.virtual_accounts
TO service_role
USING (true)
WITH CHECK (true);

-- Grant additional permissions to the trigger function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

-- Create profiles for existing users
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    avatar_url,
    referral_code,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', ''),
    COALESCE(au.raw_user_meta_data->>'phone', ''),
    COALESCE(au.raw_user_meta_data->>'avatar_url', ''),
    UPPER(SUBSTRING(au.id::text, 1, 4) || SUBSTRING(MD5(RANDOM()::text), 1, 4)),
    NOW(),
    NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL; 