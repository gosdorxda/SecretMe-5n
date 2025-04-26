-- Tambahkan kolom phone_number ke tabel users
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_channel TEXT DEFAULT 'email';
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_notifications BOOLEAN DEFAULT false;
