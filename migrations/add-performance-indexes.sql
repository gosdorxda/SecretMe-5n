-- Optimasi indeks untuk tabel messages
-- Indeks untuk pencarian pesan berdasarkan user_id (digunakan di dashboard)
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages (user_id);

-- Indeks untuk sorting berdasarkan created_at (digunakan di banyak query)
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);

-- Indeks komposit untuk user_id dan created_at (untuk query yang sering digunakan)
CREATE INDEX IF NOT EXISTS idx_messages_user_id_created_at ON messages (user_id, created_at DESC);

-- Optimasi indeks untuk tabel message_rate_limits
-- Indeks untuk pencarian berdasarkan ip_address dan recipient_id (digunakan di rate limit check)
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_recipient ON message_rate_limits (ip_address, recipient_id);

-- Indeks untuk last_attempt (digunakan untuk sorting)
CREATE INDEX IF NOT EXISTS idx_rate_limits_last_attempt ON message_rate_limits (last_attempt DESC);

-- Optimasi indeks untuk tabel notification_logs
-- Indeks untuk pencarian berdasarkan user_id (digunakan di dashboard)
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs (user_id);

-- Indeks untuk pencarian berdasarkan message_id (digunakan di notifikasi)
CREATE INDEX IF NOT EXISTS idx_notification_logs_message_id ON notification_logs (message_id);

-- Indeks untuk sorting berdasarkan created_at (digunakan di banyak query)
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs (created_at DESC);

-- Indeks untuk status (digunakan untuk filtering)
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs (status);

-- Optimasi indeks untuk tabel premium_transactions
-- Indeks untuk pencarian berdasarkan user_id (digunakan di dashboard)
CREATE INDEX IF NOT EXISTS idx_premium_transactions_user_id ON premium_transactions (user_id);

-- Indeks untuk status (digunakan untuk filtering)
CREATE INDEX IF NOT EXISTS idx_premium_transactions_status ON premium_transactions (status);

-- Indeks untuk sorting berdasarkan created_at (digunakan di banyak query)
CREATE INDEX IF NOT EXISTS idx_premium_transactions_created_at ON premium_transactions (created_at DESC);

-- Optimasi indeks untuk tabel public_replies
-- Indeks untuk pencarian berdasarkan message_id (digunakan di halaman profil)
CREATE INDEX IF NOT EXISTS idx_public_replies_message_id ON public_replies (message_id);

-- Indeks untuk sorting berdasarkan created_at (digunakan di banyak query)
CREATE INDEX IF NOT EXISTS idx_public_replies_created_at ON public_replies (created_at DESC);

-- Optimasi indeks untuk tabel profile_views
-- Indeks untuk pencarian berdasarkan user_id (digunakan di dashboard)
CREATE INDEX IF NOT EXISTS idx_profile_views_user_id ON profile_views (user_id);

-- Optimasi indeks untuk tabel telegram_connection_codes
-- Indeks untuk pencarian berdasarkan user_id (digunakan di koneksi Telegram)
CREATE INDEX IF NOT EXISTS idx_telegram_connection_codes_user_id ON telegram_connection_codes (user_id);

-- Indeks untuk pencarian berdasarkan code (digunakan di verifikasi kode)
CREATE INDEX IF NOT EXISTS idx_telegram_connection_codes_code ON telegram_connection_codes (code);

-- Indeks untuk expires_at (digunakan untuk pembersihan kode kadaluarsa)
CREATE INDEX IF NOT EXISTS idx_telegram_connection_codes_expires_at ON telegram_connection_codes (expires_at);

-- Optimasi indeks untuk tabel users
-- Indeks untuk pencarian berdasarkan username (digunakan di halaman profil)
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- Indeks untuk pencarian berdasarkan numeric_id (digunakan di halaman profil)
CREATE INDEX IF NOT EXISTS idx_users_numeric_id ON users (numeric_id);

-- Indeks untuk is_premium (digunakan untuk filtering)
CREATE INDEX IF NOT EXISTS idx_users_is_premium ON users (is_premium);

-- Tambahkan partial index untuk user premium (untuk query yang hanya mencari user premium)
CREATE INDEX IF NOT EXISTS idx_users_premium_only ON users (id) WHERE is_premium = true;

-- Tambahkan partial index untuk user dengan telegram_id (untuk notifikasi)
CREATE INDEX IF NOT EXISTS idx_users_with_telegram ON users (id) WHERE telegram_id IS NOT NULL;

-- Tambahkan partial index untuk user dengan telegram_notifications (untuk notifikasi)
CREATE INDEX IF NOT EXISTS idx_users_telegram_notifications ON users (id) WHERE telegram_notifications = true;

-- Tambahkan indeks untuk kolom yang sering digunakan dalam JOIN
CREATE INDEX IF NOT EXISTS idx_users_id ON users (id);

-- Log hasil pembuatan indeks
INSERT INTO sitemap_logs (type, status, details, created_at)
VALUES ('database_optimization', 'success', '{"message": "Performance indexes added successfully"}', NOW());
