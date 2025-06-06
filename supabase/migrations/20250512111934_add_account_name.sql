-- Add account_name column to virtual_accounts table
ALTER TABLE virtual_accounts
ADD COLUMN IF NOT EXISTS account_name text NOT NULL DEFAULT '';

-- Update existing records to use the user's full name
UPDATE virtual_accounts va
SET account_name = p.full_name
FROM profiles p
WHERE va.user_id = p.id; 