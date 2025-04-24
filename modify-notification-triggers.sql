-- Hapus trigger untuk notifikasi balasan
DROP TRIGGER IF EXISTS trigger_reply_update_notification ON messages;
DROP FUNCTION IF EXISTS notify_reply_update();

-- Pastikan trigger untuk pesan baru tetap ada
-- Jika perlu, kita bisa membuat ulang fungsi dan trigger untuk pesan baru
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
 INSERT INTO notification_logs (
   user_id,
   message_id,
   notification_type,
   channel,
   status,
   created_at
 ) VALUES (
   NEW.user_id,
   NEW.id,
   'new_message',
   'app',
   'pending',
   NOW()
 );
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pastikan trigger untuk pesan baru tetap ada
DROP TRIGGER IF EXISTS trigger_new_message_notification ON messages;
CREATE TRIGGER trigger_new_message_notification
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();
