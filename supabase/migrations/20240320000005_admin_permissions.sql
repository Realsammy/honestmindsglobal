-- Enable RLS on the profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_all_users();
DROP FUNCTION IF EXISTS public.update_user_role(UUID, TEXT);

-- Create a policy that allows users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create a policy that allows admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
  )
);

-- Create a policy that allows admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
  )
);

-- Create a policy that allows admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
  )
);

-- Create the get_all_users function
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  referral_code TEXT,
  virtual_account_id TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.created_at,
    p.updated_at,
    p.referral_code,
    p.virtual_account_id
  FROM public.profiles p;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;

-- Create the update_user_role function
CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only super admins can update user roles';
  END IF;

  -- Update the user's role in auth.users
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', new_role)
  WHERE id = target_user_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) TO authenticated; 