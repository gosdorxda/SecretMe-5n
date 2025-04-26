import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRecentNotificationLogs() {
  console.log("🔍 CHECKING RECENT NOTIFICATION LOGS")
  console.log("==================================\n")

  try {
    // Get the most recent notification logs
    const limit = process.argv[2] ? Number.parseInt(process.argv[2]) : 10
    console.log(`Fetching the ${limit} most recent notification logs...\n`)

    const { data: logs, error } = await supabase
      .from("notification_logs")
      .select(`
        id,
        user_id,
        message_id,
        channel,
        status,
        details,
        created_at,
        users (
          username,
          notification_channel,
          telegram_chat_id
        ),
        messages (
          content
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("❌ Error fetching notification logs:", error)
      return
    }

    if (!logs || logs.length === 0) {
      console.log("❌ No notification logs found")
      return
    }

    console.log(`✅ Found ${logs.length} notification logs:\n`)

    logs.forEach((log, index) => {
      console.log(`📝 Log #${index + 1} (ID: ${log.id})`)
      console.log(`   Created: ${new Date(log.created_at).toLocaleString()}`)
      console.log(`   User: ${log.users?.username || "Unknown"} (${log.user_id})`)
      console.log(
        `   Message: ${log.messages?.content?.substring(0, 50)}${log.messages?.content?.length > 50 ? "..." : ""}`,
      )
      console.log(`   Channel: ${log.channel}`)
      console.log(`   Status: ${log.status}`)
      console.log(`   Details: ${JSON.stringify(log.details, null, 2)}`)
      console.log("")
    })

    // Check for notification logs with errors
    const errorLogs = logs.filter((log) => log.status === "error")
    if (errorLogs.length > 0) {
      console.log(`⚠️ Found ${errorLogs.length} notification logs with errors:`)
      errorLogs.forEach((log, index) => {
        console.log(`   Error #${index + 1}: ${log.details?.error || "Unknown error"}`)
      })
      console.log("")
    }

    console.log("✨ CHECK COMPLETE")
  } catch (error) {
    console.error("Error checking notification logs:", error)
  }
}

// Run the function
checkRecentNotificationLogs()
