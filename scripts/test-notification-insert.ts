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

async function testNotificationInsert() {
  console.log("🧪 TESTING NOTIFICATION LOG INSERT")
  console.log("===============================\n")

  try {
    // Create a test notification log
    const testLog = {
      user_id: "test-user-id", // Replace with a valid user ID if needed
      message_id: "test-message-id", // Replace with a valid message ID if needed
      notification_type: "test",
      channel: "test",
      status: "test",
      error_message: "This is a test log",
      data: { test: true, timestamp: new Date().toISOString() },
    }

    console.log("Inserting test notification log:")
    console.log(testLog)
    console.log("")

    // Insert the test log
    const { data, error } = await supabase.from("notification_logs").insert(testLog).select()

    if (error) {
      console.error("❌ Error inserting test log:", error)

      // Check if the error is related to table structure
      if (error.code === "42P01") {
        console.log("Table does not exist. Please create the notification_logs table.")
      } else if (error.code === "42703") {
        console.log("Column does not exist. Please check the table structure.")
      } else if (error.code === "23503") {
        console.log("Foreign key violation. Please use valid user_id and message_id.")
      }

      return
    }

    console.log("✅ Test log inserted successfully:")
    console.log(data)
    console.log("")

    // Verify the log was inserted
    const { data: retrievedLog, error: retrieveError } = await supabase
      .from("notification_logs")
      .select("*")
      .eq("id", data[0].id)
      .single()

    if (retrieveError) {
      console.error("❌ Error retrieving test log:", retrieveError)
      return
    }

    console.log("✅ Test log retrieved successfully:")
    console.log(retrievedLog)
    console.log("")

    // Clean up the test log
    const { error: deleteError } = await supabase.from("notification_logs").delete().eq("id", data[0].id)

    if (deleteError) {
      console.error("❌ Error deleting test log:", deleteError)
      return
    }

    console.log("✅ Test log deleted successfully")
    console.log("")

    console.log("✨ TEST COMPLETE")
  } catch (error) {
    console.error("Error testing notification insert:", error)
  }
}

// Run the function
testNotificationInsert()
