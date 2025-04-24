-- Drop the premium_transactions table if it exists
DROP TABLE IF EXISTS premium_transactions;

-- Remove premium-related columns from the users table
ALTER TABLE public.users DROP COLUMN IF EXISTS is_premium;
ALTER TABLE public.users DROP COLUMN IF EXISTS premium_expires_at;
