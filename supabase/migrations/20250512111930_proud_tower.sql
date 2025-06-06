/*
  # Create Users Table and Policies

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `referralCode` (text, unique)
      - `referralLink` (text)
      - `createdAt` (timestamptz)

  2. Security
    - Enable RLS on `users` table
    - Add policies for:
      - Authenticated users to read their own data
      - Authenticated users to update their own data
      - Allow new user registration
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  "referralCode" text UNIQUE,
  "referralLink" text,
  "createdAt" timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for registration"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);