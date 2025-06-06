/*
  # Add Virtual Account Support

  1. New Tables
    - `virtual_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `account_number` (text)
      - `bank_name` (text)
      - `tx_ref` (text)
      - `flw_ref` (text)
      - `created_at` (timestamp)
      - `order_ref` (text)
      - `bvn` (text, encrypted)
      - `frequency` (text)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on `virtual_accounts` table
    - Add policy for authenticated users to read their own virtual accounts
*/

-- Create virtual_accounts table
CREATE TABLE IF NOT EXISTS virtual_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  account_number text NOT NULL,
  bank_name text NOT NULL,
  tx_ref text NOT NULL,
  flw_ref text,
  created_at timestamptz DEFAULT now(),
  order_ref text,
  bvn text,
  frequency text DEFAULT 'FLAT',
  is_active boolean DEFAULT true,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE virtual_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own virtual account"
  ON virtual_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to handle Flutterwave webhooks
CREATE OR REPLACE FUNCTION handle_flutterwave_webhook(
  payload jsonb
) RETURNS void AS $$
BEGIN
  -- Insert transaction record
  INSERT INTO transactions (
    user_id,
    amount,
    type,
    status,
    reference,
    description
  )
  SELECT 
    va.user_id,
    (payload->>'amount')::numeric,
    'contribution',
    'successful',
    payload->>'tx_ref',
    'Virtual account deposit'
  FROM virtual_accounts va
  WHERE va.account_number = payload->>'account_number';

  -- Update user's drift balance
  -- This is a simplified example - you'll need to adjust based on your business logic
  UPDATE drifts d
  SET balance = balance + (payload->>'amount')::numeric
  FROM virtual_accounts va
  WHERE va.user_id = d.user_id
  AND va.account_number = payload->>'account_number'
  AND d.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;