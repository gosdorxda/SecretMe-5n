-- Tambahkan kolom allow_public_replies ke tabel users dengan nilai default false
ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_public_replies BOOLEAN DEFAULT false;
