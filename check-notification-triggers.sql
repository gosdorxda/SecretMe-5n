-- SQL untuk memeriksa trigger notifikasi di database
-- Jalankan di Supabase SQL Editor

-- Periksa trigger yang ada di database
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_statement
FROM 
  information_schema.triggers
WHERE 
  trigger_schema = 'public'
ORDER BY 
  event_object_table, trigger_name;

-- Periksa fungsi trigger yang terkait dengan notifikasi
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM 
  pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE 
  n.nspname = 'public'
  AND (
    p.proname LIKE '%notif%'
    OR p.proname LIKE '%message%'
  );
