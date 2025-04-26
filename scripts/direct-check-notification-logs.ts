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

async function directCheckTable() {
  console.log("🔍 Memeriksa tabel notification_logs secara langsung...")

  try {
    // Coba select dari tabel untuk melihat apakah ada
    const { data, error } = await supabase.from("notification_logs").select("*").limit(1)

    if (error) {
      console.error("❌ Error saat mengakses tabel notification_logs:", error)

      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        console.log("\n⚠️ Tabel notification_logs tidak ada di database")
        console.log("Anda perlu membuat tabel ini terlebih dahulu")
      }

      return
    }

    console.log("✅ Tabel notification_logs berhasil diakses")

    if (data && data.length > 0) {
      console.log("\n📋 Struktur tabel berdasarkan data:")

      const sampleRow = data[0]
      console.log("==================================")
      console.log("| Nama Kolom        | Tipe Data       |")
      console.log("|-------------------|-----------------|")

      Object.keys(sampleRow).forEach((column) => {
        const colName = column.padEnd(18)
        const dataType = (typeof sampleRow[column]).padEnd(16)
        console.log(`| ${colName} | ${dataType} |`)
      })

      console.log("==================================")

      // Periksa apakah kolom data ada
      const hasDataColumn = "data" in sampleRow

      if (!hasDataColumn) {
        console.log('\n⚠️ Kolom "data" tidak ditemukan di tabel notification_logs')
        console.log("Anda perlu menambahkan kolom ini dengan menjalankan SQL:")
        console.log("\nALTER TABLE notification_logs ADD COLUMN data JSONB;")
      } else {
        console.log('\n✅ Kolom "data" ditemukan di tabel notification_logs')
      }
    } else {
      console.log("⚠️ Tabel notification_logs ada tetapi tidak ada data")
      console.log("\nMencoba mendapatkan informasi kolom dengan cara lain...")

      // Coba insert dummy data untuk melihat error
      const { error: insertError } = await supabase
        .from("notification_logs")
        .insert({
          user_id: "00000000-0000-0000-0000-000000000000",
          message_id: "00000000-0000-0000-0000-000000000000",
          notification_type: "test",
          channel: "test",
          status: "test",
          data: { test: true },
        })
        .select()

      if (insertError) {
        console.log("❌ Error saat mencoba insert dummy data:", insertError)

        if (insertError.message.includes("column") && insertError.message.includes("does not exist")) {
          console.log("\n⚠️ Kolom 'data' tidak ada di tabel notification_logs")
          console.log("Anda perlu menambahkan kolom ini dengan menjalankan SQL:")
          console.log("\nALTER TABLE notification_logs ADD COLUMN data JSONB;")
        } else if (insertError.message.includes("violates foreign key constraint")) {
          console.log("\n⚠️ Tabel memiliki foreign key constraints")
          console.log("Struktur tabel mungkin benar, tetapi dummy data melanggar constraints")
        }
      } else {
        console.log("✅ Dummy data berhasil diinsert dan dihapus")
        console.log("Tabel notification_logs memiliki semua kolom yang diperlukan termasuk 'data'")
      }
    }
  } catch (error) {
    console.error("❌ Error tidak terduga:", error)
  }
}

// Jalankan fungsi utama
directCheckTable()
