-- =============================================
-- BAGIAN 1: MENAMBAHKAN INDEKS UNTUK FOREIGN KEYS
-- =============================================

-- 1. Menambahkan indeks untuk message_rate_limits.recipient_id
CREATE INDEX IF NOT EXISTS idx_message_rate_limits_recipient_id 
ON public.message_rate_limits (recipient_id);

-- 2. Menambahkan indeks untuk notification_logs.message_id
CREATE INDEX IF NOT EXISTS idx_notification_logs_message_id 
ON public.notification_logs (message_id);

-- 3. Menambahkan indeks untuk rate_limit_config.updated_by
CREATE INDEX IF NOT EXISTS idx_rate_limit_config_updated_by 
ON public.rate_limit_config (updated_by);

-- 4. Menambahkan indeks untuk telegram_verification.user_id
CREATE INDEX IF NOT EXISTS idx_telegram_verification_user_id 
ON public.telegram_verification (user_id);

-- Log hasil pembuatan indeks
INSERT INTO sitemap_logs (type, status, details, created_at)
VALUES ('database_optimization', 'success', '{"message": "Foreign key indexes added successfully"}', NOW());

-- =============================================
-- BAGIAN 2: MENGHAPUS INDEKS YANG TIDAK DIGUNAKAN
-- =============================================
-- CATATAN: Sebaiknya jangan langsung menghapus indeks yang tidak digunakan
-- tanpa analisis lebih lanjut. Beberapa indeks mungkin digunakan untuk
-- operasi yang jarang dilakukan atau untuk backup/restore.

-- Berikut adalah contoh script untuk menghapus indeks yang tidak digunakan
-- Silakan uncomment jika sudah yakin indeks tersebut tidak diperlukan

/*
-- Menghapus indeks yang tidak digunakan pada tabel admin_alerts
DROP INDEX IF EXISTS admin_alerts_created_at_idx;
DROP INDEX IF EXISTS admin_alerts_unread_idx;

-- Menghapus indeks yang tidak digunakan pada tabel auth_logs
DROP INDEX IF EXISTS idx_auth_logs_created_at;
DROP INDEX IF EXISTS idx_auth_logs_ip_address;
DROP INDEX IF EXISTS idx_auth_logs_log_type;
DROP INDEX IF EXISTS idx_auth_logs_user_id;

-- Menghapus indeks yang tidak digunakan pada tabel message_rate_limits
DROP INDEX IF EXISTS idx_message_rate_limits_user_recipient;

-- Menghapus indeks yang tidak digunakan pada tabel notification_logs
DROP INDEX IF EXISTS idx_notification_logs_user_id;

-- Menghapus indeks yang tidak digunakan pada tabel payment_notification_logs
DROP INDEX IF EXISTS idx_payment_notification_logs_created_at;
DROP INDEX IF EXISTS idx_payment_notification_logs_order_id;
DROP INDEX IF EXISTS idx_payment_notification_logs_request_id;

-- Menghapus indeks yang tidak digunakan pada tabel premium_transactions
DROP INDEX IF EXISTS idx_premium_transactions_gateway_reference;
DROP INDEX IF EXISTS idx_premium_transactions_status;
DROP INDEX IF EXISTS idx_premium_transactions_user_id;
DROP INDEX IF EXISTS premium_transactions_idempotency_key_idx;
DROP INDEX IF EXISTS premium_transactions_status_idx;

-- Menghapus indeks yang tidak digunakan pada tabel profile_views
DROP INDEX IF EXISTS profile_views_user_id_idx;

-- Menghapus indeks yang tidak digunakan pada tabel telegram_verification
DROP INDEX IF EXISTS telegram_verification_code_idx;

-- Menghapus indeks yang tidak digunakan pada tabel users
DROP INDEX IF EXISTS users_last_ip_idx;
*/

-- Log hasil analisis indeks
INSERT INTO sitemap_logs (type, status, details, created_at)
VALUES ('database_optimization', 'info', '{"message": "Unused indexes identified but not removed. Manual review recommended."}', NOW());
