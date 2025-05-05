-- Add idempotency_key column to premium_transactions table
ALTER TABLE premium_transactions ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Create index for idempotency_key
CREATE INDEX IF NOT EXISTS premium_transactions_idempotency_key_idx ON premium_transactions (idempotency_key);
