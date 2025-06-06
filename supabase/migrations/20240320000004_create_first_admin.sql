-- Create a function to create the first admin account
CREATE OR REPLACE FUNCTION create_first_admin(
    admin_email text,
    admin_password text,
    admin_full_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_id uuid;
BEGIN
    -- Check if any admin exists
    IF EXISTS (
        SELECT 1 FROM auth.users
        WHERE role IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'An admin account already exists';
    END IF;

    -- Create the admin user
    INSERT INTO auth.users (
        email,
        encrypted_password,
        email_confirmed_at,
        role,
        raw_user_meta_data
    ) VALUES (
        admin_email,
        crypt(admin_password, gen_salt('bf')),
        now(),
        'super_admin',
        jsonb_build_object(
            'full_name', admin_full_name,
            'is_admin', true
        )
    )
    RETURNING id INTO admin_id;

    -- Create the admin's profile
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        is_admin
    ) VALUES (
        admin_id,
        admin_full_name,
        admin_email,
        true
    );

    RETURN admin_id;
END;
$$;

-- Create the first admin account
SELECT create_first_admin(
    'admin@example.com',  -- Change this to your desired admin email
    'Admin@123',         -- Change this to your desired admin password
    'System Administrator'
);

-- Drop the function after use for security
DROP FUNCTION create_first_admin(text, text, text); 