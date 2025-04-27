-- Tambahkan indeks untuk meningkatkan performa query
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue (status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status_created_at ON notification_queue (status, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status_priority_created_at ON notification_queue (status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue (user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_channel ON notification_queue (channel);
