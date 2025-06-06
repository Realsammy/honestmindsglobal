-- Create user_roles table
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');

-- Add role column to auth.users
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- Create complaints table
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

-- Create user_actions table for audit trail
CREATE TABLE IF NOT EXISTS public.user_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid REFERENCES auth.users NOT NULL,
    user_id uuid REFERENCES auth.users NOT NULL,
    action_type varchar(50) NOT NULL,
    action_details jsonb,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;

-- Create policies for complaints
CREATE POLICY "Users can view their own complaints"
    ON public.complaints
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all complaints"
    ON public.complaints
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role IN ('admin', 'super_admin')
        )
    );

-- Create policies for user_actions
CREATE POLICY "Admins can view all user actions"
    ON public.user_actions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role IN ('admin', 'super_admin')
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_user_actions_admin_id ON public.user_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON public.user_actions(user_id);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = user_id
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = user_id
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 