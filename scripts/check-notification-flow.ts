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

// Get user ID from command line arguments
const userId = process.argv[2]

if (!userId) {
  console.error("❌ Please provide a user ID as an argument")
  console.log("Usage: npx tsx scripts/check-notification-flow.ts USER_ID")
  process.exit(1)
}

async function checkNotificationFlow() {
  console.log("🔍 DEBUGGING NOTIFICATION FLOW")
  console.log("============================\n")

  // 1. Check user data
  console.log("1️⃣ CHECKING USER DATA")
  console.log("--------------------")

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, name, username, notification_channel, telegram_chat_id")
    .eq("id", userId)
    .single()

  if (userError || !userData) {
    console.error("❌ User not found:", userError?.message || "Unknown error")
    process.exit(1)
  }

  console.log("✅ User found:")
  console.log(`   Name: ${userData.name || "N/A"}`)
  console.log(`   Username: ${userData.username || "N/A"}`)
  console.log(`   Notification Channel: ${userData.notification_channel || "N/A"}`)
  console.log(`   Telegram Chat ID: ${userData.telegram_chat_id || "N/A"}\n`)

  // 2. Check notification settings
  console.log("2️⃣ CHECKING NOTIFICATION SETTINGS")
  console.log("------------------------------")

  if (!userData.telegram_chat_id) {
    console.log("❌ User does not have a Telegram chat ID")
    console.log("   Please connect Telegram first")
  } else {
    console.log("✅ Telegram Chat ID is set")
  }

  if (userData.notification_channel !== "telegram") {
    console.log(`⚠️ User's notification channel is not set to 'telegram'`)
    console.log(`   Current notification channel: ${userData.notification_channel || "not set"}`)
  } else {
    console.log("✅ Notification channel is set to 'telegram'")
  }
  console.log("")

  // 3. Check Telegram bot token
  console.log("3️⃣ CHECKING TELEGRAM BOT TOKEN")
  console.log("---------------------------")

  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN

  if (!telegramBotToken) {
    console.log("❌ TELEGRAM_BOT_TOKEN is not defined")
    console.log("   Please set the TELEGRAM_BOT_TOKEN environment variable")
  } else {
    console.log("✅ TELEGRAM_BOT_TOKEN is defined")

    // Check if the bot is working
    try {
      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/getMe`)
      const data = await response.json()

      if (data.ok) {
        console.log("✅ Telegram Bot API is working")
        console.log(`   Bot Name: ${data.result.first_name}`)
        console.log(`   Bot Username: @${data.result.username}`)
      } else {
        console.log("❌ Telegram Bot API error:", data.description)
      }
    } catch (error: any) {
      console.log("❌ Error checking Telegram Bot API:", error.message)
    }
  }
  console.log("")

  // 4. Check notification endpoint
  console.log("4️⃣ CHECKING NOTIFICATION ENDPOINT")
  console.log("------------------------------")

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  try {
    const response = await fetch(`${appUrl}/api/notifications/trigger`)
    const data = await response.json()

    if (data.success || data.message) {
      console.log("✅ Notification endpoint is accessible")
    } else {
      console.log("⚠️ Notification endpoint returned unexpected response:", data)
    }
  } catch (error: any) {
    console.log("❌ Error accessing notification endpoint:", error.message)
  }
  console.log("")

  // 5. Check notification logs table
  console.log("5️⃣ CHECKING NOTIFICATION LOGS TABLE")
  console.log("---------------------------------")

  try {
    // Check if notification_logs table exists
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "notification_logs")

    if (tablesError) {
      console.log("❌ Error fetching tables:", tablesError)
    } else if (!tables || tables.length === 0) {
      console.log("❌ notification_logs table does not exist")
    } else {
      console.log("✅ notification_logs table exists")

      // Check recent notification logs for this user
      const { data: logs, error: logsError } = await supabase
        .from("notification_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)

      if (logsError) {
        console.log("❌ Error fetching notification logs:", logsError)
      } else if (!logs || logs.length === 0) {
        console.log("ℹ️ No notification logs found for this user")
      } else {
        console.log("✅ Latest notification log found:")
        console.log(`   ID: ${logs[0].id}`)
        console.log(`   Status: ${logs[0].status}`)
        console.log(`   Channel: ${logs[0].channel}`)
        console.log(`   Created At: ${new Date(logs[0].created_at).toLocaleString()}`)
        console.log(`   Message ID: ${logs[0].message_id}`)
      }
    }
  } catch (error: any) {
    console.log("❌ Error checking notification_logs table:", error.message)
  }
  console.log("")

  // 6. Send test message
  console.log("6️⃣ SENDING TEST MESSAGE")
  console.log("---------------------")

  if (!userData.telegram_chat_id || !telegramBotToken) {
    console.log("ℹ️ Skipping test message (missing Telegram Chat ID or Bot Token)")
  } else {
    try {
      const testMessage = `
🧪 Test notification from SecretMe

Hello ${userData.name || "User"},

This is a test notification to verify your Telegram notification setup.

Time: ${new Date().toLocaleString()}
      `

      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: userData.telegram_chat_id,
          text: testMessage,
        }),
      })

      const data = await response.json()

      if (data.ok) {
        console.log("✅ Test message sent successfully")
      } else {
        console.log("❌ Error sending test message:", data.description)
      }
    } catch (error: any) {
      console.log("❌ Error sending test message:", error.message)
    }
  }
  console.log("")

  // 7. Recommendations
  console.log("7️⃣ RECOMMENDATIONS")
  console.log("----------------")

  const recommendations = []

  if (!userData.telegram_chat_id) {
    recommendations.push(
      "• Connect Telegram first\n  1. Login to SecretMe\n  2. Go to Dashboard or Settings\n  3. Find Telegram Notification settings\n  4. Generate code and send it to @secretme_official_bot",
    )
  }

  if (userData.notification_channel !== "telegram") {
    recommendations.push(
      `• Update notification_channel to 'telegram'\n  Run: npx tsx scripts/fix-user-notification-channel.ts ${userId}`,
    )
  }

  if (!telegramBotToken) {
    recommendations.push("• Set the TELEGRAM_BOT_TOKEN environment variable\n  Add to .env file or export in terminal")
  }

  if (recommendations.length > 0) {
    console.log(recommendations.join("\n\n"))
  } else {
    console.log("✅ All notification settings look good!")
  }

  console.log("\n✨ DEBUG COMPLETE")
}

// Run the function
checkNotificationFlow().catch((error) => {
  console.error("Error:", error)
  process.exit(1)
})
