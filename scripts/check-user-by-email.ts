// Script untuk memeriksa data pengguna berdasarkan email
// Jalankan dengan: npx tsx scripts/check-user-by-email.ts user@example.com

import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  console.error(
    "Run with: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/check-user-by-email.ts user@example.com",
  )
  process.exit(1)
}

// Ambil email dari argumen command line
const email = process.argv[2]
if (!email) {
  console.error("Please provide an email address")
  console.error("Usage: npx tsx scripts/check-user-by-email.ts user@example.com")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkUserByEmail() {
  try {
    console.log(`🔍 CHECKING USER DATA FOR EMAIL: ${email}`)
    console.log("=====================================\n")

    // Cari pengguna berdasarkan email di auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(email)

    if (authError) {
      console.error("❌ Error fetching auth user:", authError)
    } else if (!authUser || !authUser.user) {
      console.log("❌ No auth user found with this email")
    } else {
      console.log("✅ Auth User Found:")
      console.log(`   ID: ${authUser.user.id}`)
      console.log(`   Email: ${authUser.user.email}`)
      console.log(`   Created At: ${new Date(authUser.user.created_at).toLocaleString()}`)
      console.log(
        `   Last Sign In: ${authUser.user.last_sign_in_at ? new Date(authUser.user.last_sign_in_at).toLocaleString() : "Never"}`,
      )
      console.log("")

      // Cari data pengguna di tabel users
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.user.id)
        .single()

      if (userError) {
        console.error("❌ Error fetching user data:", userError)
      } else if (!userData) {
        console.log("❌ No user data found in users table")
      } else {
        console.log("✅ User Data Found:")
        console.log(`   ID: ${userData.id}`)
        console.log(`   Name: ${userData.name || "N/A"}`)
        console.log(`   Username: ${userData.username || "N/A"}`)
        console.log(`   Notification Channel: ${userData.notification_channel || "N/A"}`)
        console.log(`   Telegram Chat ID: ${userData.telegram_chat_id || "N/A"}`)

        // Tampilkan semua kolom lain
        console.log("\n   Other Fields:")
        Object.entries(userData).forEach(([key, value]) => {
          if (!["id", "name", "username", "notification_channel", "telegram_chat_id"].includes(key)) {
            console.log(`   - ${key}: ${value !== null ? value : "N/A"}`)
          }
        })
      }
    }
  } catch (error) {
    console.error("Error checking user by email:", error)
  }
}

checkUserByEmail()
