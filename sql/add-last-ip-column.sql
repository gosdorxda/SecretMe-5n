-- Add last_ip column to users table for fraud detection
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip TEXT;

-- Create index for last_ip
CREATE INDEX IF NOT EXISTS users_last_ip_idx ON users (last_ip);
