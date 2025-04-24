-- Tambahkan kolom payment_details ke tabel premium_transactions jika belum ada
ALTER TABLE premium_transactions ADD COLUMN IF NOT EXISTS payment_details JSONB;

-- Tambahkan kolom payment_method ke tabel premium_transactions jika belum ada
ALTER TABLE premium_transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Tambahkan kolom updated_at ke tabel premium_transactions jika belum ada
ALTER TABLE premium_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;
