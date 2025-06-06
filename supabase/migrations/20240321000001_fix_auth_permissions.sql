-- Create a function to grant necessary permissions
CREATE OR REPLACE FUNCTION grant_permissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Grant schema usage
    EXECUTE 'GRANT USAGE ON SCHEMA auth TO authenticated';
    EXECUTE 'GRANT USAGE ON SCHEMA public TO authenticated';
    
    -- Grant table permissions
    EXECUTE 'GRANT SELECT ON auth.users TO authenticated';
    
    -- Grant permissions for public schema objects
    EXECUTE 'GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated';
    EXECUTE 'GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated';
    EXECUTE 'GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated';
    
    -- Grant permissions to service_role
    EXECUTE 'GRANT USAGE ON SCHEMA public TO service_role';
    EXECUTE 'GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role';
    EXECUTE 'GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role';
    EXECUTE 'GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role';
END;
$$;

-- Execute the function
SELECT grant_permissions();

-- Enable RLS on all tables
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thrifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own thrifts" ON public.thrifts;
DROP POLICY IF EXISTS "Users can create own thrifts" ON public.thrifts;
DROP POLICY IF EXISTS "Users can update own thrifts" ON public.thrifts;
DROP POLICY IF EXISTS "Users can view own virtual accounts" ON public.virtual_accounts;
DROP POLICY IF EXISTS "Users can create own virtual accounts" ON public.virtual_accounts;
DROP POLICY IF EXISTS "Users can update own virtual accounts" ON public.virtual_accounts;

-- Create more permissive policies for testing
CREATE POLICY "Enable all access for authenticated users"
ON public.wallets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users"
ON public.transactions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users"
ON public.thrifts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users"
ON public.virtual_accounts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create a view for user data that's safe to expose
CREATE OR REPLACE VIEW public.user_data AS
SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'phone' as phone,
    raw_user_meta_data->>'avatar_url' as avatar_url,
    role,
    created_at,
    updated_at
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON public.user_data TO authenticated;

-- Create RLS policies for the view
ALTER VIEW public.user_data OWNER TO authenticated;

-- Create policy for users to view their own data
CREATE POLICY "Users can view own data"
    ON public.user_data
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Create policy for admins to view all user data
CREATE POLICY "Admins can view all user data"
    ON public.user_data
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role IN ('admin', 'super_admin')
        )
    );

-- Drop the function after use
DROP FUNCTION IF EXISTS grant_permissions(); 