// Script untuk menemukan pengguna yang sudah terhubung dengan Telegram
// Jalankan dengan: npx tsx scripts/find-connected-telegram-users.ts

import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  console.error(
    "Run with: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/find-connected-telegram-users.ts",
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function findConnectedTelegramUsers() {
  try {
    console.log("🔍 FINDING USERS CONNECTED TO TELEGRAM")
    console.log("=====================================\n")

    // Cari pengguna yang memiliki telegram_chat_id
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, email, username, notification_channel, telegram_chat_id")
      .not("telegram_chat_id", "is", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching users:", error)
      return
    }

    if (!users || users.length === 0) {
      console.log("❌ No users found with Telegram connection")
      return
    }

    console.log(`✅ Found ${users.length} users connected to Telegram:\n`)

    users.forEach((user, index) => {
      console.log(`User #${index + 1}:`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Name: ${user.name || "N/A"}`)
      console.log(`   Email: ${user.email || "N/A"}`)
      console.log(`   Username: ${user.username || "N/A"}`)
      console.log(`   Notification Channel: ${user.notification_channel || "N/A"}`)
      console.log(`   Telegram Chat ID: ${user.telegram_chat_id}`)
      console.log("")
    })

    // Cari pengguna dengan notification_channel = telegram tapi tidak ada telegram_chat_id
    const { data: inconsistentUsers, error: inconsistentError } = await supabase
      .from("users")
      .select("id, name, email, username, notification_channel")
      .eq("notification_channel", "telegram")
      .is("telegram_chat_id", null)

    if (inconsistentError) {
      console.error("❌ Error fetching inconsistent users:", inconsistentError)
      return
    }

    if (inconsistentUsers && inconsistentUsers.length > 0) {
      console.log(
        `⚠️ Found ${inconsistentUsers.length} users with notification_channel = 'telegram' but no telegram_chat_id:\n`,
      )

      inconsistentUsers.forEach((user, index) => {
        console.log(`Inconsistent User #${index + 1}:`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Name: ${user.name || "N/A"}`)
        console.log(`   Email: ${user.email || "N/A"}`)
        console.log(`   Username: ${user.username || "N/A"}`)
        console.log(`   Notification Channel: ${user.notification_channel}`)
        console.log(`   Telegram Chat ID: null`)
        console.log("")
      })
    }
  } catch (error) {
    console.error("Error finding connected Telegram users:", error)
  }
}

findConnectedTelegramUsers()
