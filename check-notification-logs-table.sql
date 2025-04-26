-- Check if notification_logs table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'notification_logs'
) AS table_exists;

-- Get table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'notification_logs'
ORDER BY 
  ordinal_position;

-- Check for constraints
SELECT 
  tc.constraint_name, 
  tc.constraint_type, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name, 
  ccu.column_name AS foreign_column_name
FROM 
  information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  LEFT JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE 
  tc.table_schema = 'public' 
  AND tc.table_name = 'notification_logs';

-- Check for recent logs
SELECT * FROM notification_logs
ORDER BY created_at DESC
LIMIT 5;

-- Check for errors in logs
SELECT * FROM notification_logs
WHERE status = 'failed' OR error_message IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Count by status
SELECT status, COUNT(*) 
FROM notification_logs
GROUP BY status;

-- Count by channel
SELECT channel, COUNT(*) 
FROM notification_logs
GROUP BY channel;
