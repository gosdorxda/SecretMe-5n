-- SQL untuk memeriksa definisi fungsi notifikasi
-- Jalankan di Supabase SQL Editor

-- Periksa definisi fungsi notify_new_message
SELECT pg_get_functiondef('public.notify_new_message'::regproc);

-- Periksa definisi fungsi notify_reply_update
SELECT pg_get_functiondef('public.notify_reply_update'::regproc);

-- Alternatif jika pg_get_functiondef tidak tersedia
SELECT 
  p.proname AS function_name,
  pg_catalog.pg_get_function_arguments(p.oid) AS function_arguments,
  CASE WHEN l.lanname = 'internal' THEN p.prosrc
       ELSE pg_catalog.pg_get_functiondef(p.oid)
  END AS function_definition,
  l.lanname AS language
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_language l ON l.oid = p.prolang
WHERE p.proname IN ('notify_new_message', 'notify_reply_update')
  AND pg_catalog.pg_function_is_visible(p.oid);
