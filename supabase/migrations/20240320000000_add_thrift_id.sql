-- Check if thrift_id column exists in thrifts table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'thrifts' 
        AND column_name = 'thrift_id'
    ) THEN
        -- Add thrift_id column to thrifts table
        ALTER TABLE thrifts ADD COLUMN thrift_id VARCHAR(13);
    END IF;
END $$;

-- Generate unique thrift_ids for existing records
WITH updated_thrifts AS (
  SELECT 
    id,
    'HMG' || LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0') as new_thrift_id
  FROM thrifts
  WHERE thrift_id IS NULL
)
UPDATE thrifts t
SET thrift_id = u.new_thrift_id
FROM updated_thrifts u
WHERE t.id = u.id;

-- Now add the unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'thrifts' 
        AND constraint_name = 'thrifts_thrift_id_key'
    ) THEN
        ALTER TABLE thrifts ADD CONSTRAINT thrifts_thrift_id_key UNIQUE (thrift_id);
    END IF;
END $$;

-- Add index for faster lookups if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'thrifts' 
        AND indexname = 'idx_thrifts_thrift_id'
    ) THEN
        CREATE INDEX idx_thrifts_thrift_id ON thrifts(thrift_id);
    END IF;
END $$;

-- Now we can safely add the NOT NULL constraint, but only if all thrift_id values are non-null
DO $$
DECLARE
  null_count integer;
BEGIN
  SELECT COUNT(*) INTO null_count FROM thrifts WHERE thrift_id IS NULL;
  IF null_count = 0 THEN
    ALTER TABLE thrifts ALTER COLUMN thrift_id SET NOT NULL;
  END IF;
END $$;

-- Update transactions table to use thrift_id instead of id for thrift reference
ALTER TABLE transactions 
  DROP CONSTRAINT IF EXISTS transactions_thrift_id_fkey;

-- Create a temporary column for the new thrift_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'new_thrift_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN new_thrift_id VARCHAR(13);
  END IF;
END $$;

-- Update the temporary column with thrift_ids from the thrifts table
UPDATE transactions t
SET new_thrift_id = thr.thrift_id
FROM thrifts thr
WHERE t.thrift_id::text = thr.id::text;

-- Drop the old thrift_id column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'thrift_id'
  ) THEN
    ALTER TABLE transactions DROP COLUMN thrift_id;
  END IF;
END $$;

-- Rename the new column to thrift_id
ALTER TABLE transactions RENAME COLUMN new_thrift_id TO thrift_id;

-- Add foreign key constraint
ALTER TABLE transactions
  ADD CONSTRAINT transactions_thrift_id_fkey 
  FOREIGN KEY (thrift_id) 
  REFERENCES thrifts(thrift_id);