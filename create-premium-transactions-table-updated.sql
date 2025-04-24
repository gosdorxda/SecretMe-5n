-- Buat tabel premium_transactions jika belum ada
CREATE TABLE IF NOT EXISTS premium_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plan_id VARCHAR(255) NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Buat indeks untuk mempercepat pencarian
CREATE INDEX IF NOT EXISTS idx_premium_transactions_user_id ON premium_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_transactions_plan_id ON premium_transactions(plan_id);
CREATE INDEX IF NOT EXISTS idx_premium_transactions_status ON premium_transactions(status);

-- Tambahkan kolom is_premium dan premium_expires_at ke tabel users jika belum ada
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE;

-- Tambahkan RLS (Row Level Security) untuk tabel premium_transactions
ALTER TABLE premium_transactions ENABLE ROW LEVEL SECURITY;

-- Kebijakan untuk admin (dapat melihat semua transaksi)
CREATE POLICY admin_all_access ON premium_transactions 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Kebijakan untuk pengguna (hanya dapat melihat transaksi mereka sendiri)
CREATE POLICY user_own_access ON premium_transactions 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());
