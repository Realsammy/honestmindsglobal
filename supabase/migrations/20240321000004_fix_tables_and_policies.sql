-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.wallets;
DROP POLICY IF EXISTS "Users can view own thrifts" ON public.thrifts;
DROP POLICY IF EXISTS "Users can create own thrifts" ON public.thrifts;
DROP POLICY IF EXISTS "Users can update own thrifts" ON public.thrifts;

-- Ensure tables have correct structure
ALTER TABLE public.thrifts 
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create policies for wallets table
CREATE POLICY "Enable all wallet operations for authenticated users"
ON public.wallets
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policies for thrifts table
CREATE POLICY "Enable all thrift operations for authenticated users"
ON public.thrifts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thrifts ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.wallets TO authenticated;
GRANT ALL ON public.thrifts TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 