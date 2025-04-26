// Script untuk memperbaiki notification_channel pengguna tertentu
// Jalankan dengan: npx tsx scripts/fix-user-notification-channel.ts USER_ID

import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function fixUserNotificationChannel() {
  try {
    const userId = process.argv[2]

    if (!userId) {
      console.error("Please provide a user ID")
      console.log("Usage: npx tsx scripts/fix-user-notification-channel.ts USER_ID")
      process.exit(1)
    }

    console.log(`Memperbaiki notification_channel untuk pengguna: ${userId}`)

    // Ambil data user
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError || !userData) {
      console.error("Error fetching user data:", userError)
      console.error("User not found")
      process.exit(1)
    }

    console.log("Data pengguna saat ini:")
    console.log(`- Nama: ${userData.name}`)
    console.log(`- Username: ${userData.username}`)
    console.log(`- Notification Channel: ${userData.notification_channel || "Not set"}`)
    console.log(`- Telegram Chat ID: ${userData.telegram_chat_id || "Not set"}`)

    // Periksa apakah pengguna memiliki telegram_chat_id
    if (userData.telegram_chat_id && userData.notification_channel !== "telegram") {
      console.log("\nPengguna memiliki Telegram Chat ID tapi notification_channel bukan 'telegram'")

      // Update notification_channel ke 'telegram'
      const { error: updateError } = await supabase
        .from("users")
        .update({ notification_channel: "telegram" })
        .eq("id", userId)

      if (updateError) {
        console.error("Error updating notification channel:", updateError)
        process.exit(1)
      }

      console.log("✅ Berhasil memperbarui notification_channel menjadi 'telegram'")
    } else if (!userData.telegram_chat_id && userData.notification_channel === "telegram") {
      console.log("\nPengguna tidak memiliki Telegram Chat ID tapi notification_channel adalah 'telegram'")

      // Update notification_channel ke 'email'
      const { error: updateError } = await supabase
        .from("users")
        .update({ notification_channel: "email" })
        .eq("id", userId)

      if (updateError) {
        console.error("Error updating notification channel:", updateError)
        process.exit(1)
      }

      console.log("✅ Berhasil memperbarui notification_channel menjadi 'email'")
    } else {
      console.log("\nPengaturan notification_channel sudah benar, tidak perlu diperbarui.")
    }
  } catch (error) {
    console.error("Error fixing user notification channel:", error)
  }
}

fixUserNotificationChannel()
