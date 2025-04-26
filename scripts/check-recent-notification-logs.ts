import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import type { Database } from "../lib/supabase/database.types"

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
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

// Get limit from command line arguments
const limit = Number.parseInt(process.argv[2] || "10", 10)

async function checkRecentNotificationLogs() {
  console.log("📋 CHECKING RECENT NOTIFICATION LOGS")
  console.log("==================================\n")

  // Check if notification_logs table exists using a simpler approach
  try {
    // Try to select a single row from notification_logs to check if it exists
    const { data: testData, error: testError } = await supabase.from("notification_logs").select("id").limit(1)

    if (testError && testError.code === "42P01") {
      // Table doesn't exist error code
      console.error("❌ notification_logs table does not exist")
      process.exit(1)
    } else if (testError) {
      console.error("❌ Error checking notification_logs table:", testError)
      process.exit(1)
    }

    console.log("✅ notification_logs table exists")
  } catch (error: any) {
    console.error("❌ Error checking notification_logs table:", error.message)
    process.exit(1)
  }

  // Get recent notification logs
  const { data: logs, error: logsError } = await supabase
    .from("notification_logs")
    .select("*, users(name)")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (logsError) {
    console.error("❌ Error fetching notification logs:", logsError)
    process.exit(1)
  }

  if (!logs || logs.length === 0) {
    console.log("ℹ️ No notification logs found")
    process.exit(0)
  }

  console.log(`✅ Found ${logs.length} notification logs\n`)

  // Display logs
  logs.forEach((log, index) => {
    const userName = log.users?.name || "Unknown User"

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
}

// Run the function
checkRecentNotificationLogs().catch((error) => {
  console.error("Error:", error)
  process.exit(1)
})
