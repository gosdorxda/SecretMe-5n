import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Validasi environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diatur")
  process.exit(1)
}

// Ambil email dari command line argument
const email = process.argv[2]
if (!email) {
  console.error("Error: Email harus disediakan sebagai argument")
  console.log("Penggunaan: npx tsx scripts/get-user-id.ts email@anda.com")
  process.exit(1)
}

// Buat Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getUserId() {
  try {
    // Cari user di tabel auth.users
    const { data: authUser, error: authError } = await supabase
      .from("users")
      .select("id, email, name, username, is_premium, telegram_chat_id, notification_channel")
      .eq("email", email)
      .single()

    if (authError) {
      console.error("Error mencari user:", authError.message)
      return
    }

    if (!authUser) {
      console.log(`User dengan email ${email} tidak ditemukan`)
      return
    }

    console.log("User ditemukan:")
    console.log("-----------------------------------")
    console.log(`ID: ${authUser.id}`)
    console.log(`Email: ${authUser.email}`)
    console.log(`Nama: ${authUser.name || "Tidak diatur"}`)
    console.log(`Username: ${authUser.username || "Tidak diatur"}`)
    console.log(`Premium: ${authUser.is_premium ? "Ya" : "Tidak"}`)
    console.log(`Telegram Chat ID: ${authUser.telegram_chat_id || "Tidak diatur"}`)
    console.log(`Notification Channel: ${authUser.notification_channel || "Tidak diatur"}`)
    console.log("-----------------------------------")

    // Untuk digunakan dalam script lain
    console.log("\nGunakan ID ini untuk script lain:")
    console.log(`YOUR_USER_ID=${authUser.id}`)
  } catch (error) {
    console.error("Error tidak terduga:", error)
  }
}

getUserId()
