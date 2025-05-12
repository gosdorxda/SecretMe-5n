-- Tambahkan kolom telegram_id ke tabel telegram_connection_codes jika belum ada
ALTER TABLE telegram_connection_codes
ADD COLUMN IF NOT EXISTS telegram_id TEXT;
