// Script untuk memeriksa kode verifikasi Telegram
// Jalankan dengan: npx tsx scripts/check-verification-codes.ts

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

async function checkVerificationCodes() {
  try {
    console.log("Memeriksa tabel kode verifikasi...\n")

    // Cek tabel telegram_verification
    const { data: telegramVerification, error: telegramError } = await supabase
      .from("telegram_verification")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (telegramError) {
      console.error("Error fetching telegram_verification:", telegramError)
    } else {
      console.log("Tabel telegram_verification:")
      if (telegramVerification && telegramVerification.length > 0) {
        console.table(telegramVerification)
      } else {
        console.log("Tidak ada data di tabel telegram_verification")
      }
    }

    // Cek tabel verification_codes
    const { data: verificationCodes, error: verificationError } = await supabase
      .from("verification_codes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (verificationError) {
      console.error("Error fetching verification_codes:", verificationError)
    } else {
      console.log("\nTabel verification_codes:")
      if (verificationCodes && verificationCodes.length > 0) {
        console.table(verificationCodes)
      } else {
        console.log("Tidak ada data di tabel verification_codes")
      }
    }

    // Cek struktur tabel
    console.log("\nMemeriksa struktur tabel...")

    // Daftar semua tabel
    const { data: tables, error: tablesError } = await supabase.rpc("list_tables")

    if (tablesError) {
      console.error("Error listing tables:", tablesError)
    } else {
      console.log("Tabel yang tersedia:")
      console.log(tables)
    }
  } catch (error) {
    console.error("Error checking verification codes:", error)
  }
}

checkVerificationCodes()
