-- Create payment notification logs table
CREATE TABLE IF NOT EXISTS payment_notification_logs (
  id SERIAL PRIMARY KEY,
  request_id TEXT NOT NULL,
  gateway TEXT NOT NULL,
  raw_payload JSONB,
  parsed_payload JSONB,
  headers JSONB,
  status TEXT,
  error TEXT,
  transaction_id TEXT,
  order_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_notification_logs_request_id ON payment_notification_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_payment_notification_logs_order_id ON payment_notification_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_notification_logs_created_at ON payment_notification_logs(created_at);
