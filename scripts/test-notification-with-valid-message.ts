import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import fetch from "node-fetch"

// Load environment variables
dotenv.config()

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testNotificationWithValidMessage() {
  console.log("🧪 TESTING NOTIFICATION WITH VALID MESSAGE")
  console.log("=======================================\n")

  try {
    // 1. Get a valid user ID
    console.log("1️⃣ Getting a valid user ID...")
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id, name, username, notification_channel, telegram_chat_id")
      .eq("notification_channel", "telegram")
      .not("telegram_chat_id", "is", null)
      .limit(1)

    if (userError || !users || users.length === 0) {
      console.error("❌ Error getting a valid user:", userError || "No users found with Telegram configured")
      return
    }

    const user = users[0]
    console.log(`✅ Found user: ${user.username} (${user.id})`)
    console.log(`   Telegram chat ID: ${user.telegram_chat_id}`)
    console.log(`   Notification channel: ${user.notification_channel}`)
    console.log("")

    // 2. Get a valid message ID
    console.log("2️⃣ Getting a valid message ID...")
    const { data: messages, error: messageError } = await supabase
      .from("messages")
      .select("id, content")
      .eq("user_id", user.id)
      .limit(1)

    if (messageError || !messages || messages.length === 0) {
      console.log("❌ No existing messages found for this user. Creating a test message...")

      // Create a test message
      const { data: newMessage, error: newMessageError } = await supabase
        .from("messages")
        .insert({
          user_id: user.id,
          content: "This is a test message for notification testing",
        })
        .select()
        .single()

      if (newMessageError || !newMessage) {
        console.error("❌ Error creating test message:", newMessageError)
        return
      }

      console.log(`✅ Created test message: ${newMessage.id}`)
      console.log(`   Content: ${newMessage.content}`)
      console.log("")

      var messageId = newMessage.id
    } else {
      console.log(`✅ Found message: ${messages[0].id}`)
      console.log(`   Content: ${messages[0].content}`)
      console.log("")

      var messageId = messages[0].id
    }

    // 3. Test the notification endpoint
    console.log("3️⃣ Testing notification endpoint...")
    const notificationData = {
      userId: user.id,
      messageId: messageId,
      type: "new_message",
    }

    console.log("Sending notification request:")
    console.log(notificationData)
    console.log("")

    const response = await fetch(`${appUrl}/api/notifications/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notificationData),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error(`❌ Error from notification endpoint (${response.status}):`, result)
      return
    }

    console.log("✅ Notification endpoint response:")
    console.log(result)
    console.log("")

    // 4. Check if notification log was created
    console.log("4️⃣ Checking notification logs...")
    const { data: logs, error: logsError } = await supabase
      .from("notification_logs")
      .select("*")
      .eq("message_id", messageId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)

    if (logsError) {
      console.error("❌ Error checking notification logs:", logsError)
      return
    }

    if (!logs || logs.length === 0) {
      console.error("❌ No notification logs found for this message and user")
      return
    }

    console.log("✅ Found notification log:")
    console.log(logs[0])
    console.log("")

    console.log("✨ TEST COMPLETE")
  } catch (error) {
    console.error("Error testing notification with valid message:", error)
  }
}

// Run the function
testNotificationWithValidMessage()
