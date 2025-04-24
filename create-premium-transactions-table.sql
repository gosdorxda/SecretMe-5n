-- Buat tabel premium_transactions jika belum ada
CREATE TABLE IF NOT EXISTS premium_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  merchant_order_id VARCHAR(255) NOT NULL UNIQUE,
  payment_reference VARCHAR(255),
  amount INTEGER NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Buat indeks untuk mempercepat pencarian
CREATE INDEX IF NOT EXISTS idx_premium_transactions_user_id ON premium_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_transactions_merchant_order_id ON premium_transactions(merchant_order_id);
CREATE INDEX IF NOT EXISTS idx_premium_transactions_status ON premium_transactions(status);

-- Tambahkan kolom is_premium dan premium_expires_at ke tabel users jika belum ada
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE;
