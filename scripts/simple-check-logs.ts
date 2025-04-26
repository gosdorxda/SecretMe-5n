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

// Get limit from command line arguments
const limit = Number.parseInt(process.argv[2] || "10", 10)

async function checkRecentNotificationLogs() {
  console.log("📋 CHECKING RECENT NOTIFICATION LOGS (SIMPLE VERSION)")
  console.log("=================================================\n")

  try {
    // Get recent notification logs
    const { data: logs, error: logsError } = await supabase
      .from("notification_logs")
      .select("*")
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

    console.log(`✅ Found ${logs.length} notification logs\n`)

    // Display logs
    logs.forEach((log, index) => {
      console.log(`📝 LOG #${index + 1}`)
      console.log(`ID: ${log.id}`)
      console.log(`User ID: ${log.user_id}`)
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
    console.error("Error:", error)
  }
}

// Run the function
checkRecentNotificationLogs()
