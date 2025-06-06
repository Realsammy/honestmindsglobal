-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES auth.users NOT NULL,
  referred_id uuid REFERENCES auth.users NOT NULL,
  referral_code text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(referred_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own referrals"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals where they were referred"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referred_id);

-- Create function to handle referral tracking
CREATE OR REPLACE FUNCTION handle_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If there's a referral code in the metadata, create a referral record
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    INSERT INTO referrals (
      referrer_id,
      referred_id,
      referral_code,
      status
    )
    SELECT 
      p.id,
      NEW.id,
      NEW.raw_user_meta_data->>'referral_code',
      'active'
    FROM profiles p
    WHERE p.referral_code = NEW.raw_user_meta_data->>'referral_code';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for referral tracking
CREATE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral(); 