-- Hapus trigger untuk notifikasi pesan baru
DROP TRIGGER IF EXISTS trigger_new_message_notification ON messages;

-- Hapus fungsi untuk notifikasi pesan baru
DROP FUNCTION IF EXISTS notify_new_message();

-- Hapus tabel notification_logs
DROP TABLE IF EXISTS notification_logs;
