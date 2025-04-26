-- Tambahkan kolom telegram_chat_id ke tabel users
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

-- Buat tabel telegram_verification
CREATE TABLE IF NOT EXISTS telegram_verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS telegram_verification_code_idx ON telegram_verification(code);
