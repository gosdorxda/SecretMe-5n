// Script untuk memantau alur notifikasi secara real-time
// Jalankan dengan: npx tsx scripts/monitor-notification-flow.ts [USER_ID]

import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  console.error(
    "Run with: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/monitor-notification-flow.ts [USER_ID]",
  )
  process.exit(1)
}

// Ambil user ID dari argumen command line (opsional)
const userId = process.argv[2]

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function monitorNotificationFlow() {
  try {
    console.log("🔍 MONITORING NOTIFICATION FLOW")
    console.log("=============================\n")

    if (userId) {
      console.log(`Monitoring notifications for user ID: ${userId}\n`)
    } else {
      console.log("Monitoring notifications for all users\n")
    }

    console.log("Waiting for new notifications...\n")
    console.log("Press Ctrl+C to stop monitoring\n")

    // Subscribe ke perubahan pada tabel notification_logs
    const subscription = supabase
      .channel("notification-logs-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_logs",
          filter: userId ? `user_id=eq.${userId}` : undefined,
        },
        async (payload) => {
          const log = payload.new

          // Ambil data user
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("name, username")
            .eq("id", log.user_id)
            .single()

          const userName = userData ? userData.name || userData.username || "Unknown" : "Unknown"

          console.log("\n📝 NEW NOTIFICATION LOG")
          console.log(`Time: ${new Date().toLocaleString()}`)
          console.log(`ID: ${log.id}`)
          console.log(`User: ${userName} (${log.user_id})`)
          console.log(`Type: ${log.notification_type}`)
          console.log(`Channel: ${log.channel}`)
          console.log(`Status: ${log.status}`)

          if (log.message_id) {
            console.log(`Message ID: ${log.message_id}`)
          }

          if (log.error_message) {
            console.log(`Error: ${log.error_message}`)
          }

          if (log.data) {
            console.log("Data:", log.data)
          }

          console.log("\nWaiting for more notifications...")
        },
      )
      .subscribe()

    // Biarkan script berjalan sampai user menekan Ctrl+C
    process.on("SIGINT", () => {
      console.log("\n\nStopping monitoring...")
      subscription.unsubscribe()
      process.exit(0)
    })
  } catch (error) {
    console.error("Error monitoring notification flow:", error)
  }
}

monitorNotificationFlow()
