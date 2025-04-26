-- Add telegram_id and telegram_notifications columns to users table
ALTER TABLE users
ADD COLUMN telegram_id TEXT,
ADD COLUMN telegram_notifications BOOLEAN DEFAULT FALSE;
