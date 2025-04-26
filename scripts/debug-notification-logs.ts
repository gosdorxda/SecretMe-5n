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

async function debugNotificationLogs() {
  console.log("🔍 DEBUGGING NOTIFICATION LOGS")
  console.log("============================\n")

  try {
    // 1. Check if notification_logs table exists
    console.log("1️⃣ CHECKING TABLE STRUCTURE")
    console.log("-------------------------")

    // Get table columns
    const { data: columns, error: columnsError } = await supabase.rpc("get_table_columns", {
      table_name: "notification_logs",
    })

    if (columnsError) {
      console.error("❌ Error fetching table columns:", columnsError)

      // Try direct query
      console.log("Trying direct query to check if table exists...")

      const { data: tableExists, error: tableExistsError } = await supabase
        .from("notification_logs")
        .select("id")
        .limit(1)

      if (tableExistsError) {
        if (tableExistsError.code === "42P01") {
          // relation does not exist
          console.error("❌ notification_logs table does not exist")
          console.log("Please create the table first")
          return
        } else {
          console.error("❌ Error checking if table exists:", tableExistsError)
          return
        }
      } else {
        console.log("✅ notification_logs table exists")
      }
    } else {
      console.log("✅ notification_logs table exists with columns:")
      columns.forEach((col) => {
        console.log(`   - ${col.column_name} (${col.data_type})`)
      })
    }
    console.log("")

    // 2. Check recent logs
    console.log("2️⃣ CHECKING RECENT LOGS")
    console.log("---------------------")

    const { data: logs, error: logsError } = await supabase
      .from("notification_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)

    if (logsError) {
      console.error("❌ Error fetching logs:", logsError)
      return
    }

    if (!logs || logs.length === 0) {
      console.log("ℹ️ No notification logs found")
    } else {
      console.log(`✅ Found ${logs.length} recent logs:`)
      logs.forEach((log, index) => {
        console.log(`\nLOG #${index + 1}:`)
        console.log(`ID: ${log.id}`)
        console.log(`User ID: ${log.user_id}`)
        console.log(`Message ID: ${log.message_id || "N/A"}`)
        console.log(`Type: ${log.notification_type}`)
        console.log(`Channel: ${log.channel}`)
        console.log(`Status: ${log.status}`)
        console.log(`Created: ${new Date(log.created_at).toLocaleString()}`)

        if (log.error_message) {
          console.log(`Error: ${log.error_message}`)
        }

        if (log.data) {
          console.log("Data:", log.data)
        }
      })
    }
    console.log("")

    // 3. Check for errors
    console.log("3️⃣ CHECKING FOR ERRORS")
    console.log("--------------------")

    const { data: errorLogs, error: errorLogsError } = await supabase
      .from("notification_logs")
      .select("*")
      .or("status.eq.failed,error_message.not.is.null")
      .order("created_at", { ascending: false })
      .limit(5)

    if (errorLogsError) {
      console.error("❌ Error fetching error logs:", errorLogsError)
      return
    }

    if (!errorLogs || errorLogs.length === 0) {
      console.log("✅ No error logs found")
    } else {
      console.log(`⚠️ Found ${errorLogs.length} error logs:`)
      errorLogs.forEach((log, index) => {
        console.log(`\nERROR LOG #${index + 1}:`)
        console.log(`ID: ${log.id}`)
        console.log(`User ID: ${log.user_id}`)
        console.log(`Message ID: ${log.message_id || "N/A"}`)
        console.log(`Type: ${log.notification_type}`)
        console.log(`Channel: ${log.channel}`)
        console.log(`Status: ${log.status}`)
        console.log(`Created: ${new Date(log.created_at).toLocaleString()}`)
        console.log(`Error: ${log.error_message}`)

        if (log.data) {
          console.log("Data:", log.data)
        }
      })
    }
    console.log("")

    // 4. Check notification counts
    console.log("4️⃣ CHECKING NOTIFICATION COUNTS")
    console.log("----------------------------")

    const { data: counts, error: countsError } = await supabase.rpc("get_notification_counts").select()

    if (countsError) {
      console.error("❌ Error fetching notification counts:", countsError)

      // Try direct query
      console.log("Trying direct query to get counts...")

      const { data: statusCounts, error: statusCountsError } = await supabase
        .from("notification_logs")
        .select("status, count")
        .select("status, count(*)")
        .group("status")

      if (statusCountsError) {
        console.error("❌ Error getting status counts:", statusCountsError)
      } else {
        console.log("Status counts:")
        statusCounts.forEach((count) => {
          console.log(`   - ${count.status}: ${count.count}`)
        })
      }

      const { data: channelCounts, error: channelCountsError } = await supabase
        .from("notification_logs")
        .select("channel, count(*)")
        .group("channel")

      if (channelCountsError) {
        console.error("❌ Error getting channel counts:", channelCountsError)
      } else {
        console.log("Channel counts:")
        channelCounts.forEach((count) => {
          console.log(`   - ${count.channel}: ${count.count}`)
        })
      }
    } else {
      console.log("Notification counts:")
      counts.forEach((count) => {
        console.log(`   - ${count.category}: ${count.count}`)
      })
    }

    console.log("\n✨ DEBUG COMPLETE")
  } catch (error) {
    console.error("Error debugging notification logs:", error)
  }
}

// Run the function
debugNotificationLogs()
