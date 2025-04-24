-- Buat tabel untuk menyimpan balasan publik
CREATE TABLE IF NOT EXISTS public_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Tambahkan indeks untuk mempercepat pencarian
CREATE INDEX IF NOT EXISTS idx_public_replies_message_id ON public_replies(message_id);
