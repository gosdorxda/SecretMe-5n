// Script untuk memperbaiki notification_channel pengguna yang sudah terhubung dengan Telegram
// Jalankan dengan: npx tsx scripts/fix-notification-channel.ts

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

async function fixNotificationChannel() {
  try {
    console.log("Mencari pengguna dengan telegram_chat_id yang terisi tapi notification_channel bukan 'telegram'...")

    // Cari pengguna dengan telegram_chat_id yang terisi tapi notification_channel bukan 'telegram'
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, username, telegram_chat_id, notification_channel")
      .not("telegram_chat_id", "is", null)
      .neq("notification_channel", "telegram")

    if (error) {
      console.error("Error fetching users:", error)
      process.exit(1)
    }

    if (!users || users.length === 0) {
      console.log("Tidak ada pengguna yang perlu diperbaiki.")
      process.exit(0)
    }

    console.log(`Ditemukan ${users.length} pengguna yang perlu diperbaiki:`)

    for (const user of users) {
      console.log(
        `- ${user.name} (${user.username || user.id}): notification_channel = ${user.notification_channel || "null"}`,
      )

      // Update notification_channel ke 'telegram'
      const { error: updateError } = await supabase
        .from("users")
        .update({ notification_channel: "telegram" })
        .eq("id", user.id)

      if (updateError) {
        console.error(`  Error updating user ${user.id}:`, updateError)
      } else {
        console.log(`  ✅ Berhasil memperbarui notification_channel menjadi 'telegram'`)
      }
    }

    console.log("\nSelesai memperbaiki notification_channel pengguna.")
  } catch (error) {
    console.error("Error fixing notification channel:", error)
  }
}

fixNotificationChannel()
