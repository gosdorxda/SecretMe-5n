// Script untuk memeriksa log notifikasi terbaru
// Jalankan dengan: npx tsx scripts/check-recent-notification-logs.ts [LIMIT]

import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  console.error(
    "Run with: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/check-recent-notification-logs.ts [LIMIT]",
  )
  process.exit(1)
}

// Ambil limit dari argumen command line
const limit = Number.parseInt(process.argv[2] || "10", 10)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkRecentNotificationLogs() {
  try {
    console.log(`🔍 CHECKING ${limit} MOST RECENT NOTIFICATION LOGS`)
    console.log("===========================================\n")

    // Ambil log notifikasi terbaru
    const { data: logs, error } = await supabase
      .from("notification_logs")
      .select("*, users(name, username)")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("❌ Error fetching notification logs:", error)
      return
    }

    if (!logs || logs.length === 0) {
      console.log("ℹ️ No notification logs found")
      return
    }

    console.log(`✅ Found ${logs.length} notification logs\n`)

    logs.forEach((log, index) => {
      const userName = log.users ? log.users.name || log.users.username || "Unknown" : "Unknown"

      console.log(`📝 LOG #${index + 1}`)
      console.log(`ID: ${log.id}`)
      console.log(`User: ${userName} (${log.user_id})`)
      console.log(`Type: ${log.notification_type}`)
      console.log(`Channel: ${log.channel}`)
      console.log(`Status: ${log.status}`)
      console.log(`Created At: ${new Date(log.created_at).toLocaleString()}`)

      if (log.message_id) {
        console.log(`Message ID: ${log.message_id}`)
      }

      if (log.error_message) {
        console.log(`Error: ${log.error_message}`)
      }

      if (log.data) {
        console.log("Data:", log.data)
      }

      console.log("")
    })

    console.log("✨ CHECK COMPLETE")
  } catch (error) {
    console.error("Error checking notification logs:", error)
  }
}

checkRecentNotificationLogs()
