-- Buat tabel untuk mencatat log rate limit
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip VARCHAR(50) NOT NULL,
  path TEXT NOT NULL,
  method VARCHAR(10) NOT NULL,
  blocked BOOLEAN NOT NULL DEFAULT FALSE,
  rate INTEGER,
  limit INTEGER,
  user_id UUID,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tambahkan indeks untuk mempercepat pencarian
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_ip ON rate_limit_logs(ip);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created_at ON rate_limit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_user_id ON rate_limit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_blocked ON rate_limit_logs(blocked);

-- Tambahkan komentar pada tabel
COMMENT ON TABLE rate_limit_logs IS 'Log untuk rate limiting dan akses';
