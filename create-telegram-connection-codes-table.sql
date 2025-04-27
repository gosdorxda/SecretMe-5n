-- Create table for storing Telegram connection codes
CREATE TABLE IF NOT EXISTS telegram_connection_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_telegram_connection_codes_code ON telegram_connection_codes(code);
CREATE INDEX IF NOT EXISTS idx_telegram_connection_codes_user_id ON telegram_connection_codes(user_id);

-- Add function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_telegram_connection_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS update_telegram_connection_codes_updated_at ON telegram_connection_codes;
CREATE TRIGGER update_telegram_connection_codes_updated_at
BEFORE UPDATE ON telegram_connection_codes
FOR EACH ROW
EXECUTE FUNCTION update_telegram_connection_codes_updated_at();
