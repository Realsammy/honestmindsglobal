-- Remove duplicate wallet rows, keeping only the most recent for each user
DELETE FROM wallets a
USING wallets b
WHERE a.user_id = b.user_id
  AND a.ctid < b.ctid;

-- Add a unique constraint to ensure only one wallet per user
ALTER TABLE wallets
ADD CONSTRAINT unique_user_id UNIQUE (user_id);
