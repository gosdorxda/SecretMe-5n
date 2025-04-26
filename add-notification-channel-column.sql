-- Tambahkan kolom notification_channel ke tabel users jika belum ada
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_channel TEXT;

-- Atur nilai default untuk kolom notification_channel
UPDATE users SET notification_channel = 'email' WHERE notification_channel IS NULL;

-- Verifikasi bahwa kolom telah ditambahkan
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'notification_channel';
