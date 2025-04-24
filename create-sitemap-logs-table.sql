-- Buat tabel untuk mencatat regenerasi sitemap
CREATE TABLE IF NOT EXISTS sitemap_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  user_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
  triggered_by VARCHAR(50) NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tambahkan indeks untuk mempercepat pencarian
CREATE INDEX IF NOT EXISTS idx_sitemap_logs_triggered_at ON sitemap_logs(triggered_at);
