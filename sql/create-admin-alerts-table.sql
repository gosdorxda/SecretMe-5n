-- Create admin alerts table
CREATE TABLE IF NOT EXISTS admin_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  level TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create index for unread alerts
CREATE INDEX IF NOT EXISTS admin_alerts_unread_idx ON admin_alerts (read) WHERE read = FALSE;

-- Create index for sorting by creation date
CREATE INDEX IF NOT EXISTS admin_alerts_created_at_idx ON admin_alerts (created_at DESC);
