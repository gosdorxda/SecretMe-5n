import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://secretme.site"

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Environment variables NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
  process.exit(1)
}

// Buat Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

async function testNotificationWithoutData() {
  console.log("🧪 TESTING NOTIFICATION WITHOUT DATA COLUMN")
  console.log("=======================================\n")

  try {
    // 1. Dapatkan user ID yang valid dengan telegram_chat_id
    console.log("1️⃣ Getting a valid user ID...")
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, username, notification_channel, telegram_chat_id")
      .eq("notification_channel", "telegram")
      .not("telegram_chat_id", "is", null)
      .limit(1)

    if (usersError || !users || users.length === 0) {
      console.error("❌ No users found with Telegram configured:", usersError)
      return
    }

    const user = users[0]
    console.log(`✅ Found user: ${user.username} (${user.id})`)
    console.log(`   Telegram chat ID: ${user.telegram_chat_id}`)
    console.log(`   Notification channel: ${user.notification_channel}\n`)

    // 2. Dapatkan message ID yang valid
    console.log("2️⃣ Getting a valid message ID...")
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("id, content")
      .eq("user_id", user.id)
      .limit(1)

    let messageId
    let messageContent

    if (messagesError || !messages || messages.length === 0) {
      console.log("⚠️ No messages found for this user, creating a test message...")

      // Buat pesan test
      const { data: newMessage, error: newMessageError } = await supabase
        .from("messages")
        .insert({
          user_id: user.id,
          content: "This is a test message for notification testing",
        })
        .select()

      if (newMessageError || !newMessage) {
        console.error("❌ Failed to create test message:", newMessageError)
        return
      }

      messageId = newMessage[0].id
      messageContent = newMessage[0].content
    } else {
      messageId = messages[0].id
      messageContent = messages[0].content
    }

    console.log(`✅ Found message: ${messageId}`)
    console.log(`   Content: ${messageContent}\n`)

    // 3. Buat log notifikasi langsung tanpa menggunakan kolom data
    console.log("3️⃣ Creating notification log directly...")

    const { data: logData, error: logError } = await supabase
      .from("notification_logs")
      .insert({
        user_id: user.id,
        message_id: messageId,
        notification_type: "new_message",
        channel: "telegram",
        status: "test",
        error_message: null,
        // Tidak menggunakan kolom data
      })
      .select()

    if (logError) {
      console.error("❌ Failed to create notification log:", logError)
      return
    }

    console.log("✅ Successfully created notification log without data column")
    console.log(`   Log ID: ${logData[0].id}`)

    // 4. Uji endpoint notifikasi
    console.log("\n4️⃣ Testing notification endpoint...")
    const notificationData = {
      userId: user.id,
      messageId: messageId,
      type: "new_message",
    }

    console.log("Sending notification request:")
    console.log(notificationData)

    const response = await fetch(`${appUrl}/api/notifications/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notificationData),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error(`❌ Error from notification endpoint (${response.status}):`, responseData)
    } else {
      console.log("✅ Notification endpoint response:", responseData)
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error)
  }
}

// Jalankan fungsi utama
testNotificationWithoutData()
