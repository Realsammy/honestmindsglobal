-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS dob date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS next_of_kin_name text,
ADD COLUMN IF NOT EXISTS next_of_kin_phone text,
ADD COLUMN IF NOT EXISTS next_of_kin_address text,
ADD COLUMN IF NOT EXISTS next_of_kin_occupation text,
ADD COLUMN IF NOT EXISTS next_of_kin_dob date,
ADD COLUMN IF NOT EXISTS next_of_kin_gender text;

-- Add check constraint for gender
ALTER TABLE profiles
ADD CONSTRAINT valid_gender CHECK (gender IN ('male', 'female', 'other'));

-- Add check constraint for next of kin gender
ALTER TABLE profiles
ADD CONSTRAINT valid_next_of_kin_gender CHECK (next_of_kin_gender IN ('male', 'female', 'other')); 