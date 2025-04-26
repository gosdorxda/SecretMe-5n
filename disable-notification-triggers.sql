-- SQL untuk menonaktifkan trigger notifikasi
-- Jalankan di Supabase SQL Editor

-- Nonaktifkan trigger notifikasi
ALTER TABLE messages DISABLE TRIGGER trigger_new_message_notification;
ALTER TABLE messages DISABLE TRIGGER trigger_reply_update_notification;

-- Verifikasi status trigger
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_statement,
  'DISABLED' AS status
FROM 
  information_schema.triggers
WHERE 
  trigger_schema = 'public'
  AND trigger_name IN ('trigger_new_message_notification', 'trigger_reply_update_notification');

-- Log
SELECT 'Notification triggers disabled successfully' AS result;
