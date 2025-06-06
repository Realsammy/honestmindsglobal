-- Add referral_code column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Create index for faster referral code lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- Add RLS policy for referral code access
CREATE POLICY "Users can view referral codes"
ON profiles FOR SELECT
TO authenticated
USING (true); 