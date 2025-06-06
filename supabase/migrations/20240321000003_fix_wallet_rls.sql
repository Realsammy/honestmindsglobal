-- Drop existing policies for wallets table
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.wallets;

-- Create new policies for wallets table
CREATE POLICY "Users can view own wallet"
ON public.wallets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
ON public.wallets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet"
ON public.wallets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY; 