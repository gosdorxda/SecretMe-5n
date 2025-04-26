import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Environment variables NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
  process.exit(1)
}

// Buat Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

async function addDataColumn() {
  console.log("🔧 Menambahkan kolom 'data' ke tabel notification_logs...")

  try {
    // Jalankan SQL untuk menambahkan kolom data
    const { data, error } = await supabase.rpc("execute_sql", {
      sql_query: "ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS data JSONB",
    })

    if (error) {
      console.error("❌ Error menambahkan kolom 'data':", error)

      // Coba cara alternatif
      console.log("🔄 Mencoba cara alternatif...")

      // Gunakan REST API untuk menjalankan SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "params=single-object",
        },
        body: JSON.stringify({
          query: "ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS data JSONB",
        }),
      })

      if (!response.ok) {
        console.error("❌ Error dengan cara alternatif:", await response.text())
        console.log("\n⚠️ Tidak dapat menambahkan kolom 'data' secara otomatis")
        console.log("Silakan jalankan SQL berikut secara manual di Supabase SQL Editor:")
        console.log("\nALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS data JSONB;")
        return
      }

      console.log("✅ Kolom 'data' berhasil ditambahkan dengan cara alternatif")
      return
    }

    console.log("✅ Kolom 'data' berhasil ditambahkan ke tabel notification_logs")
    console.log("Hasil:", data)

    // Verifikasi kolom telah ditambahkan
    console.log("\n🔍 Memverifikasi kolom 'data' telah ditambahkan...")

    const { data: verifyData, error: verifyError } = await supabase.from("notification_logs").select("data").limit(1)

    if (verifyError) {
      console.error("❌ Error memverifikasi kolom 'data':", verifyError)
      return
    }

    console.log("✅ Verifikasi berhasil, kolom 'data' telah ditambahkan")
  } catch (error) {
    console.error("❌ Error tidak terduga:", error)
    console.log("\n⚠️ Tidak dapat menambahkan kolom 'data' secara otomatis")
    console.log("Silakan jalankan SQL berikut secara manual di Supabase SQL Editor:")
    console.log("\nALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS data JSONB;")
  }
}

// Jalankan fungsi utama
addDataColumn()
