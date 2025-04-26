-- Menambahkan kolom data ke tabel notification_logs
ALTER TABLE notification_logs 
ADD COLUMN IF NOT EXISTS data JSONB;

-- Menambahkan komentar untuk dokumentasi
COMMENT ON COLUMN notification_logs.data IS 'Data tambahan dalam format JSON untuk notifikasi';
