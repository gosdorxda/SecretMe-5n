// Script untuk memeriksa log notifikasi
// Jalankan dengan: npx tsx scripts/check-notification-logs.ts [limit]

import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  console.error(
    "Run with: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/check-notification-logs.ts",
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkNotificationLogs() {
  try {
    // Ambil limit dari argumen command line atau default ke 10
    const limit = Number.parseInt(process.argv[2]) || 10

    console.log(`Memeriksa ${limit} log notifikasi terbaru...\n`)

    // Ambil log notifikasi terbaru
    const { data: logs, error } = await supabase
      .from("notification_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching notification logs:", error)
      return
    }

    if (!logs || logs.length === 0) {
      console.log("Tidak ada log notifikasi yang ditemukan")
      return
    }

    console.log(`Ditemukan ${logs.length} log notifikasi\n`)

    // Tampilkan log
    for (const log of logs) {
      console.log(`ID: ${log.id}`)
      console.log(`User ID: ${log.user_id}`)
      console.log(`Message ID: ${log.message_id || "N/A"}`)
      console.log(`Tipe: ${log.notification_type}`)
      console.log(`Channel: ${log.channel}`)
      console.log(`Status: ${log.status}`)
      console.log(`Waktu: ${new Date(log.created_at).toLocaleString()}`)

      if (log.error_message) {
        console.log(`Error: ${log.error_message}`)
      }

      if (log.data) {
        console.log("Data:", log.data)
      }

      console.log("-----------------------------------")
    }

    // Periksa apakah ada tabel notification_logs
    const { data: tables, error: tablesError } = await supabase
      .from("pg_tables")
      .select("tablename")
      .eq("schemaname", "public")

    if (tablesError) {
      console.error("Error fetching tables:", tablesError)
    } else {
      const hasNotificationLogsTable = tables.some((t) => t.tablename === "notification_logs")
      if (!hasNotificationLogsTable) {
        console.log("\n⚠️ PERINGATAN: Tabel notification_logs tidak ditemukan!")
        console.log("Anda mungkin perlu membuat tabel notification_logs terlebih dahulu.")
      }
    }
  } catch (error) {
    console.error("Error checking notification logs:", error)
  }
}

checkNotificationLogs()
