-- Drop existing policies
DROP POLICY IF EXISTS "Enable all thrift operations for authenticated users" ON public.thrifts;

-- Recreate thrifts table with all required columns
CREATE TABLE IF NOT EXISTS public.thrifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    weekly_amount DECIMAL(10,2) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create policy for thrifts table
CREATE POLICY "Enable all thrift operations for authenticated users"
ON public.thrifts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable RLS
ALTER TABLE public.thrifts ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.thrifts TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 