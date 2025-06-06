-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

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

-- Grant necessary permissions for other tables
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.complaints TO authenticated;
GRANT SELECT ON public.user_actions TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT SELECT ON public.referrals TO authenticated;
GRANT SELECT ON public.user_accounts TO authenticated;

-- Grant necessary permissions for sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create a service role for handling user data operations
CREATE ROLE service_role;

-- Grant necessary permissions to service_role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Create a secure function to handle user data operations
CREATE OR REPLACE FUNCTION public.get_user_data()
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    phone text,
    avatar_url text,
    role text,
    created_at timestamptz,
    updated_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Only admins can access user data';
    END IF;

    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.raw_user_meta_data->>'full_name' as full_name,
        u.raw_user_meta_data->>'phone' as phone,
        u.raw_user_meta_data->>'avatar_url' as avatar_url,
        u.role,
        u.created_at,
        u.updated_at
    FROM auth.users u;
END;
$$;

-- Grant execute permission on the function to admin_role
GRANT EXECUTE ON FUNCTION public.get_user_data() TO admin_role;

-- Create a secure function to handle user updates
CREATE OR REPLACE FUNCTION public.update_user_role(
    target_user_id uuid,
    new_role text
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the current user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Only admins can update user roles';
    END IF;

    -- Update the user's role
    UPDATE auth.users
    SET role = new_role
    WHERE id = target_user_id;
END;
$$;

-- Grant execute permission on the function to admin_role
GRANT EXECUTE ON FUNCTION public.update_user_role(uuid, text) TO admin_role;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    );
END;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Create a function to get admin-only data
CREATE OR REPLACE FUNCTION public.get_admin_data()
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    role text,
    created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if user is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can access this data';
    END IF;

    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.raw_user_meta_data->>'full_name' as full_name,
        u.role,
        u.created_at
    FROM auth.users u;
END;
$$;

-- Grant execute permission on the function to admin_role
GRANT EXECUTE ON FUNCTION public.get_admin_data() TO admin_role;

-- Create admin role
CREATE ROLE admin_role;

-- Create necessary tables if they don't exist
CREATE TABLE IF NOT EXISTS public.complaints (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    title varchar(255) NOT NULL,
    description text NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'pending',
    priority varchar(20) NOT NULL DEFAULT 'medium',
    assigned_to uuid REFERENCES auth.users,
    resolution text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid REFERENCES auth.users NOT NULL,
    user_id uuid REFERENCES auth.users NOT NULL,
    action_type varchar(50) NOT NULL,
    action_details jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id uuid REFERENCES auth.users NOT NULL,
    referred_id uuid REFERENCES auth.users NOT NULL,
    referral_code text NOT NULL,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(referred_id)
);

CREATE TABLE IF NOT EXISTS public.user_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    account_type varchar(20) NOT NULL DEFAULT 'primary',
    wallet_balance decimal(12,2) DEFAULT 0.00,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Grant necessary permissions to admin_role
GRANT USAGE ON SCHEMA public TO admin_role;
GRANT USAGE ON SCHEMA auth TO admin_role;
GRANT SELECT ON auth.users TO admin_role;
GRANT SELECT, UPDATE ON public.profiles TO admin_role;
GRANT SELECT, UPDATE ON public.complaints TO admin_role;
GRANT SELECT, INSERT ON public.user_actions TO admin_role;
GRANT SELECT, UPDATE ON public.notifications TO admin_role;
GRANT SELECT, UPDATE ON public.referrals TO admin_role;
GRANT SELECT, UPDATE ON public.user_accounts TO admin_role;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    );
END;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Create a function to get admin-only data
CREATE OR REPLACE FUNCTION public.get_admin_data()
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    role text,
    created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if user is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can access this data';
    END IF;

    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.raw_user_meta_data->>'full_name' as full_name,
        u.role,
        u.created_at
    FROM auth.users u;
END;
$$;

-- Grant execute permission on the function to admin_role
GRANT EXECUTE ON FUNCTION public.get_admin_data() TO admin_role;

-- Create a secure function to handle user updates
CREATE OR REPLACE FUNCTION public.update_user_role(
    target_user_id uuid,
    new_role text
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the current user is an admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can update user roles';
    END IF;

    -- Update the user's role
    UPDATE auth.users
    SET role = new_role
    WHERE id = target_user_id;
END;
$$;

-- Grant execute permission on the function to admin_role
GRANT EXECUTE ON FUNCTION public.update_user_role(uuid, text) TO admin_role; 