-- SQL untuk menghapus trigger notifikasi yang mungkin menyebabkan masalah
-- Jalankan dengan: psql -U your_db_user -d your_db_name -f drop-notification-triggers.sql

-- Hapus trigger yang mungkin membuat notifikasi dengan status "pending" dan channel "app"
DROP TRIGGER IF EXISTS create_notification_on_new_message ON messages;
DROP TRIGGER IF EXISTS update_notification_on_message_reply ON messages;
DROP TRIGGER IF EXISTS process_notification_queue ON notification_logs;

-- Hapus fungsi terkait
DROP FUNCTION IF EXISTS create_notification_on_new_message();
DROP FUNCTION IF EXISTS update_notification_on_message_reply();
DROP FUNCTION IF EXISTS process_notification_queue();

-- Log
SELECT 'Notification triggers and functions dropped successfully' AS result;
