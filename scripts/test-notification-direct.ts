import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN

if (!supabaseUrl || !supabaseServiceKey || !telegramBotToken) {
  console.error(
    "❌ Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and TELEGRAM_BOT_TOKEN",
  )
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDirectNotification() {
  console.log("🧪 TESTING DIRECT TELEGRAM NOTIFICATION")
  console.log("=====================================\n")

  try {
    // 1. Get a valid user with Telegram configured
    console.log("1️⃣ Getting a valid user with Telegram configured...")
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

    // 2. Send a direct Telegram message
    console.log("2️⃣ Sending direct Telegram message...")
    const chatId = user.telegram_chat_id
    const text = `🧪 Test notification from SecretMe\n\nThis is a test message sent directly via the Telegram API at ${new Date().toISOString()}`

    console.log(`Sending message to chat ID: ${chatId}`)
    console.log(`Message: ${text}`)
    console.log("")

    // Using native fetch (Node.js 18+)
    const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`
    const response = await fetch(telegramApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
      }),
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      console.error(`❌ Error sending Telegram message (${response.status}):`, result)
      return
    }

    console.log("✅ Telegram API response:")
    console.log(result)
    console.log("")

    // 3. Create a notification log manually
    console.log("3️⃣ Creating notification log manually...")

    // First, get or create a message
    let messageId: string
    const { data: messages, error: messageError } = await supabase
      .from("messages")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)

    if (messageError || !messages || messages.length === 0) {
      // Create a test message
      const { data: newMessage, error: newMessageError } = await supabase
        .from("messages")
        .insert({
          user_id: user.id,
          content: "This is a test message for direct notification testing",
        })
        .select()
        .single()

      if (newMessageError || !newMessage) {
        console.error("❌ Error creating test message:", newMessageError)
        return
      }

      messageId = newMessage.id
      console.log(`✅ Created test message: ${messageId}`)
    } else {
      messageId = messages[0].id
      console.log(`✅ Using existing message: ${messageId}`)
    }

    // Now create the notification log
    const { data: log, error: logError } = await supabase
      .from("notification_logs")
      .insert({
        user_id: user.id,
        message_id: messageId,
        channel: "telegram",
        status: "sent",
        details: {
          telegram_message_id: result.result.message_id,
          telegram_chat_id: chatId,
          sent_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (logError) {
      console.error("❌ Error creating notification log:", logError)
      return
    }

    console.log("✅ Created notification log:")
    console.log(log)
    console.log("")

    console.log("✨ TEST COMPLETE")
  } catch (error) {
    console.error("Error testing direct notification:", error)
  }
}

// Run the function
testDirectNotification()
