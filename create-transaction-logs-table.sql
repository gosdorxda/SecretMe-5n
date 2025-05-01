-- Create transaction logs table for detailed payment tracking
CREATE TABLE IF NOT EXISTS transaction_logs (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER NOT NULL,
  order_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'create', 'update', 'verify', 'notification'
  gateway TEXT NOT NULL,
  status TEXT NOT NULL,
  previous_status TEXT,
  payment_method TEXT,
  amount NUMERIC,
  details JSONB,
  request_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_transaction_logs_transaction_id ON transaction_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_order_id ON transaction_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_user_id ON transaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_created_at ON transaction_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_event_type ON transaction_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_gateway ON transaction_logs(gateway);

-- Add comment to table
COMMENT ON TABLE transaction_logs IS 'Detailed logs for payment transaction events';
