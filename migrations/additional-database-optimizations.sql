-- =============================================
-- BAGIAN 1: OPTIMASI QUERY YANG SERING DIGUNAKAN
-- =============================================

-- 1. Menambahkan indeks komposit untuk query yang sering digunakan
-- Indeks untuk mencari pesan berdasarkan user_id dan created_at (untuk pagination)
CREATE INDEX IF NOT EXISTS idx_messages_user_id_created_at 
ON public.messages (user_id, created_at DESC);

-- Indeks untuk mencari pesan berdasarkan recipient_id dan created_at (untuk pagination)
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id_created_at 
ON public.messages (recipient_id, created_at DESC);

-- Indeks untuk mencari transaksi premium berdasarkan user_id dan status
CREATE INDEX IF NOT EXISTS idx_premium_transactions_user_id_status 
ON public.premium_transactions (user_id, status);

-- Indeks untuk mencari notifikasi berdasarkan user_id dan read_at
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id_read_at 
ON public.notification_logs (user_id, read_at);

-- =============================================
-- BAGIAN 2: PARTIAL INDEXES UNTUK KASUS SPESIFIK
-- =============================================

-- 1. Partial index untuk pesan yang belum dibaca (lebih efisien daripada full index)
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON public.messages (recipient_id, created_at DESC) 
WHERE read_at IS NULL;

-- 2. Partial index untuk transaksi premium yang pending
CREATE INDEX IF NOT EXISTS idx_premium_transactions_pending 
ON public.premium_transactions (user_id, created_at DESC) 
WHERE status = 'pending';

-- 3. Partial index untuk user premium (untuk query yang hanya mencari user premium)
CREATE INDEX IF NOT EXISTS idx_users_premium 
ON public.users (id, premium_until) 
WHERE premium_until > NOW();

-- =============================================
-- BAGIAN 3: VACUUM DAN ANALYZE UNTUK STATISTIK QUERY PLANNER
-- =============================================

-- Vacuum dan analyze tabel-tabel utama untuk memperbarui statistik query planner
VACUUM ANALYZE public.messages;
VACUUM ANALYZE public.users;
VACUUM ANALYZE public.premium_transactions;
VACUUM ANALYZE public.notification_logs;
VACUUM ANALYZE public.message_rate_limits;

-- =============================================
-- BAGIAN 4: OPTIMASI TABEL UNTUK MENGURANGI BLOAT
-- =============================================

-- Cluster tabel messages berdasarkan indeks timestamp untuk meningkatkan performa query range
-- CATATAN: Ini akan mengunci tabel, jadi sebaiknya dilakukan saat traffic rendah
-- CLUSTER public.messages USING messages_created_at_idx;

-- =============================================
-- BAGIAN 5: SETTING AUTOVACUUM UNTUK TABEL DENGAN TRAFFIC TINGGI
-- =============================================

-- Mengatur autovacuum lebih agresif untuk tabel messages
ALTER TABLE public.messages SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- Mengatur autovacuum lebih agresif untuk tabel message_rate_limits
ALTER TABLE public.message_rate_limits SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- Log hasil optimasi tambahan
INSERT INTO sitemap_logs (type, status, details, created_at)
VALUES ('database_optimization', 'success', '{"message": "Additional database optimizations completed successfully"}', NOW());
