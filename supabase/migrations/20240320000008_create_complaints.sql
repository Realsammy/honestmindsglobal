-- Create enum for complaint status if not exists
DO $$ BEGIN
    CREATE TYPE complaint_status AS ENUM ('pending', 'in_progress', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for complaint priority if not exists
DO $$ BEGIN
    CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create complaints table if not exists
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status complaint_status DEFAULT 'pending',
    priority complaint_priority DEFAULT 'medium',
    category VARCHAR(50) NOT NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    CONSTRAINT valid_category CHECK (category IN ('account', 'transaction', 'thrift', 'wallet', 'other'))
);

-- Create complaint_responses table if not exists
CREATE TABLE IF NOT EXISTS public.complaint_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can create own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can update own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can view all complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can update all complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can view own complaint responses" ON public.complaint_responses;
DROP POLICY IF EXISTS "Users can create own complaint responses" ON public.complaint_responses;
DROP POLICY IF EXISTS "Admins can view all complaint responses" ON public.complaint_responses;
DROP POLICY IF EXISTS "Admins can create all complaint responses" ON public.complaint_responses;

-- Create policies for complaints table
CREATE POLICY "Users can view own complaints"
ON public.complaints FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own complaints"
ON public.complaints FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own complaints"
ON public.complaints FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all complaints"
ON public.complaints FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
    )
);

-- Create policies for complaint_responses table
CREATE POLICY "Users can view own complaint responses"
ON public.complaint_responses FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.complaints c
        WHERE c.id = complaint_id AND c.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create own complaint responses"
ON public.complaint_responses FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.complaints c
        WHERE c.id = complaint_id AND c.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all complaint responses"
ON public.complaint_responses FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
    )
);

-- Create function to get user's complaints
CREATE OR REPLACE FUNCTION public.get_user_complaints()
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    status complaint_status,
    priority complaint_priority,
    category VARCHAR(50),
    assigned_to UUID,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    response_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        c.*,
        COUNT(cr.id) as response_count
    FROM public.complaints c
    LEFT JOIN public.complaint_responses cr ON c.id = cr.complaint_id
    WHERE c.user_id = auth.uid()
    GROUP BY c.id
    ORDER BY 
        CASE c.status
            WHEN 'pending' THEN 1
            WHEN 'in_progress' THEN 2
            WHEN 'resolved' THEN 3
            WHEN 'closed' THEN 4
        END,
        c.created_at DESC;
$$;

-- Create function to get all complaints (admin only)
CREATE OR REPLACE FUNCTION public.get_all_complaints()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    title VARCHAR(255),
    description TEXT,
    status complaint_status,
    priority complaint_priority,
    category VARCHAR(50),
    assigned_to UUID,
    assigned_to_name TEXT,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    response_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH complaint_responses AS (
        SELECT 
            complaint_id,
            COUNT(*) as response_count
        FROM public.complaint_responses
        GROUP BY complaint_id
    )
    SELECT 
        c.*,
        u.email as user_email,
        u.raw_user_meta_data->>'full_name' as user_name,
        a.raw_user_meta_data->>'full_name' as assigned_to_name,
        COALESCE(cr.response_count, 0) as response_count
    FROM public.complaints c
    JOIN auth.users u ON c.user_id = u.id
    LEFT JOIN auth.users a ON c.assigned_to = a.id
    LEFT JOIN complaint_responses cr ON c.id = cr.complaint_id
    ORDER BY 
        CASE c.status
            WHEN 'pending' THEN 1
            WHEN 'in_progress' THEN 2
            WHEN 'resolved' THEN 3
            WHEN 'closed' THEN 4
        END,
        CASE c.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        c.created_at DESC;
$$;

-- Create function to get complaint details with responses
CREATE OR REPLACE FUNCTION public.get_complaint_details(complaint_id UUID)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    status complaint_status,
    priority complaint_priority,
    category VARCHAR(50),
    assigned_to UUID,
    assigned_to_name TEXT,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    responses JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH complaint_responses AS (
        SELECT 
            cr.complaint_id,
            jsonb_agg(
                jsonb_build_object(
                    'id', cr.id,
                    'message', cr.message,
                    'is_internal', cr.is_internal,
                    'created_at', cr.created_at,
                    'user_name', u.raw_user_meta_data->>'full_name',
                    'user_role', u.raw_user_meta_data->>'role'
                )
                ORDER BY cr.created_at ASC
            ) as responses
        FROM public.complaint_responses cr
        JOIN auth.users u ON cr.user_id = u.id
        GROUP BY cr.complaint_id
    )
    SELECT 
        c.*,
        a.raw_user_meta_data->>'full_name' as assigned_to_name,
        COALESCE(cr.responses, '[]'::jsonb) as responses
    FROM public.complaints c
    LEFT JOIN auth.users a ON c.assigned_to = a.id
    LEFT JOIN complaint_responses cr ON c.id = cr.complaint_id
    WHERE c.id = complaint_id
    AND (
        c.user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
        )
    );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_complaints() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_complaints() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_complaint_details(UUID) TO authenticated; 