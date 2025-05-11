-- Hapus tabel notification_preferences yang baru jika ada
DROP TABLE IF EXISTS notification_preferences;

-- Buat ulang tabel notification_logs dengan struktur versi 7
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  notification_type VARCHAR(50) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB,
  error_message TEXT
);

-- Buat indeks untuk mempercepat pencarian
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_message_id ON notification_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- Tambahkan kolom notifikasi langsung ke tabel users jika belum ada
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_channel VARCHAR(50) DEFAULT 'email';
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_notifications BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_notifications BOOLEAN DEFAULT false;

-- Hapus kolom yang mungkin ditambahkan di versi baru
ALTER TABLE users DROP COLUMN IF EXISTS notification_preferences_id;
