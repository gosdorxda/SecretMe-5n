// Script untuk memeriksa log notifikasi
// Jalankan dengan: npx tsx scripts/check-notification-logs.ts [LIMIT]

import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  console.error(
    "Run with: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/check-notification-logs.ts [LIMIT]",
  )
  process.exit(1)
}

// Ambil limit dari argumen command line
const limit = Number.parseInt(process.argv[2] || "10", 10)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkNotificationLogs() {
  try {
    console.log("📋 CHECKING NOTIFICATION LOGS")
    console.log("==========================\n")

    // 1. Periksa tabel notification_logs
    console.log("1️⃣ CHECKING NOTIFICATION_LOGS TABLE")
    console.log("---------------------------------")

    try {
      // Periksa apakah tabel notification_logs ada
      const { data: tables, error: tablesError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")

      if (tablesError) {
        console.error("❌ Error fetching tables:", tablesError)
        return
      }

      const hasNotificationLogsTable = tables.some((t) => t.table_name === "notification_logs")

      if (!hasNotificationLogsTable) {
        console.error("❌ notification_logs table does not exist")
        console.error("   You need to create the notification_logs table first")
        return
      }

      console.log("✅ notification_logs table exists")

      // 2. Ambil log terbaru
      console.log("\n2️⃣ FETCHING RECENT NOTIFICATION LOGS")
      console.log("----------------------------------")

      const { data: logs, error: logsError } = await supabase
        .from("notification_logs")
        .select("*, users(name, username)")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (logsError) {
        console.error("❌ Error fetching notification logs:", logsError)
        return
      }

      if (!logs || logs.length === 0) {
        console.log("ℹ️ No notification logs found")
        return
      }

      console.log(`✅ Found ${logs.length} notification logs`)

      // 3. Tampilkan log
      console.log("\n3️⃣ NOTIFICATION LOGS")
      console.log("------------------")

      logs.forEach((log, index) => {
        const userName = log.users?.name || log.users?.username || "Unknown User"
        const status = log.status === "success" ? "✅" : "❌"
        const date = new Date(log.created_at).toLocaleString()

        console.log(`\n${index + 1}. ${status} ${date} - ${userName} (${log.channel || "unknown channel"})`)
        console.log(`   ID: ${log.id}`)
        console.log(`   User ID: ${log.user_id}`)
        console.log(`   Status: ${log.status}`)
        console.log(`   Message: ${log.message || "N/A"}`)

        if (log.error_message) {
          console.error(`   Error: ${log.error_message}`)
        }

        if (log.metadata) {
          try {
            const metadata = typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata
            console.log(`   Metadata: ${JSON.stringify(metadata, null, 2)}`)
          } catch (e) {
            console.log(`   Metadata: ${log.metadata}`)
          }
        }
      })

      // 4. Statistik
      console.log("\n4️⃣ STATISTICS")
      console.log("-----------")

      const successCount = logs.filter((log) => log.status === "success").length
      const failureCount = logs.filter((log) => log.status !== "success").length
      const successRate = (successCount / logs.length) * 100

      console.log(`   Total Logs: ${logs.length}`)
      console.log(`   Success: ${successCount} (${successRate.toFixed(2)}%)`)
      console.log(`   Failure: ${failureCount} (${(100 - successRate).toFixed(2)}%)`)

      const channelStats = logs.reduce((acc, log) => {
        const channel = log.channel || "unknown"
        acc[channel] = (acc[channel] || 0) + 1
        return acc
      }, {})

      console.log("   Channels:")
      Object.entries(channelStats).forEach(([channel, count]) => {
        console.log(`     - ${channel}: ${count} (${(((count as number) / logs.length) * 100).toFixed(2)}%)`)
      })
    } catch (error) {
      console.error("❌ Error checking notification logs:", error)
    }

    console.log("\n✨ CHECK COMPLETE")
  } catch (error) {
    console.error("Error checking notification logs:", error)
  }
}

checkNotificationLogs()
