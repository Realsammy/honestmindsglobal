/*
  # Create Thrift and Transactions Tables

  1. New Tables
    - `thrifts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `balance` (numeric)
      - `total_contributed` (numeric)
      - `weekly_contribution` (numeric)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `status` (text)
      - `current_week` (integer)
      - `referral_id` (uuid, references auth.users)
      - `has_defaulted` (boolean)
      - `default_weeks` (integer[])
      - `default_amount` (numeric)
      - `is_paid` (boolean)
      - `is_eligible_for_foodstuff` (boolean)
      - `created_at` (timestamptz)
      - `account_id` (text, unique)

    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `thrift_id` (uuid, references thrifts)
      - `amount` (numeric)
      - `type` (text)
      - `status` (text)
      - `reference` (text)
      - `description` (text)
      - `created_at` (timestamptz)

    - `virtual_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `account_number` (text, unique)
      - `account_name` (text)
      - `bank_name` (text)
      - `tx_ref` (text)
      - `flw_ref` (text)
      - `created_at` (timestamptz)
      - `order_ref` (text)
      - `bvn` (text)
      - `frequency` (text)
      - `is_active` (boolean)
      - `UNIQUE(user_id)`

  2. Security
    - Enable RLS on both tables
    - Add policies for:
      - Users to read their own thrifts and transactions
      - Users to create their own thrifts and transactions
      - Users to update their own thrifts
      - Admins to read all thrifts and transactions
*/

-- Create thrifts table
CREATE TABLE IF NOT EXISTS thrifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  balance numeric DEFAULT 0,
  total_contributed numeric DEFAULT 0,
  weekly_contribution numeric NOT NULL CHECK (weekly_contribution >= 2000),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL,
  current_week integer DEFAULT 1,
  referral_id uuid REFERENCES auth.users,
  has_defaulted boolean DEFAULT false,
  default_weeks integer[] DEFAULT '{}',
  default_amount numeric DEFAULT 0,
  is_paid boolean DEFAULT false,
  is_eligible_for_foodstuff boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  account_id text NOT NULL UNIQUE,
  CONSTRAINT valid_weekly_contribution CHECK (weekly_contribution >= 2000),
  CONSTRAINT valid_cycle_length CHECK (end_date = start_date + interval '52 weeks')
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  thrift_id VARCHAR(13) REFERENCES thrifts(thrift_id),
  amount numeric NOT NULL,
  type text NOT NULL,
  status text NOT NULL,
  reference text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create virtual_accounts table
CREATE TABLE IF NOT EXISTS virtual_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  account_number text UNIQUE NOT NULL,
  account_name text NOT NULL,
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
ALTER TABLE thrifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for thrifts
CREATE POLICY "Users can read own thrifts"
  ON thrifts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own thrifts"
  ON thrifts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own thrifts"
  ON thrifts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for transactions
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for virtual_accounts
CREATE POLICY "Users can view own virtual accounts"
  ON virtual_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own virtual accounts"
  ON virtual_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own virtual accounts"
  ON virtual_accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create admin policies for thrifts and transactions
CREATE POLICY "Admins can read all thrifts"
  ON thrifts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can read all transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Add virtual_account_id to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS virtual_account_id uuid REFERENCES virtual_accounts;