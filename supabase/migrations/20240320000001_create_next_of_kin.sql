-- Create next_of_kin table
CREATE TABLE IF NOT EXISTS public.next_of_kin (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.next_of_kin ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own next of kin"
    ON public.next_of_kin
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own next of kin"
    ON public.next_of_kin
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own next of kin"
    ON public.next_of_kin
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_next_of_kin_user_id ON public.next_of_kin(user_id); 