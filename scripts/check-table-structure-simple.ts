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

async function checkTableStructure() {
  console.log("🔍 Memeriksa struktur tabel notification_logs...")

  try {
    // Periksa kolom-kolom di tabel notification_logs
    const { data: columns, error } = await supabase.rpc("get_table_columns", { table_name: "notification_logs" })

    if (error) {
      console.error("❌ Error memeriksa kolom:", error)

      // Coba cara alternatif dengan query langsung
      console.log("🔄 Mencoba cara alternatif dengan query langsung...")

      const { data: directResult, error: directError } = await supabase.from("notification_logs").select("*").limit(1)

      if (directError) {
        console.error("❌ Error dengan query langsung:", directError)

        // Coba cara terakhir dengan query SQL
        console.log("🔄 Mencoba cara terakhir dengan SQL...")

        const { data: sqlResult, error: sqlError } = await supabase.rpc("execute_sql", {
          sql_query:
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notification_logs'",
        })

        if (sqlError) {
          console.error("❌ Semua metode gagal. Mungkin tabel tidak ada atau tidak dapat diakses:", sqlError)
          return
        }

        console.log("✅ Hasil dari SQL query:")
        console.log(sqlResult)
        return
      }

      // Jika query langsung berhasil, tampilkan struktur dari hasil
      console.log("✅ Tabel notification_logs ditemukan dengan query langsung")
      console.log("\n📋 Kolom-kolom yang terdeteksi dari hasil query:")

      if (directResult && directResult.length > 0) {
        const sampleRow = directResult[0]
        const columns = Object.keys(sampleRow)

        columns.forEach((column) => {
          console.log(`- ${column}: ${typeof sampleRow[column]}`)
        })

        // Periksa apakah kolom data ada
        const hasDataColumn = columns.includes("data")

        if (!hasDataColumn) {
          console.log('\n⚠️ Kolom "data" tidak ditemukan di tabel notification_logs')
          console.log("Anda perlu menambahkan kolom ini dengan menjalankan SQL:")
          console.log("\nALTER TABLE notification_logs ADD COLUMN data JSONB;")
        } else {
          console.log('\n✅ Kolom "data" ditemukan di tabel notification_logs')
        }
      } else {
        console.log("⚠️ Tabel notification_logs ada tetapi tidak ada data")
      }

      return
    }

    if (!columns || columns.length === 0) {
      console.error("❌ Tidak ada kolom yang ditemukan di tabel notification_logs")
      return
    }

    console.log("✅ Tabel notification_logs ditemukan")
    console.log("\n📋 Struktur tabel notification_logs:")
    console.log("==================================")
    console.log("| Nama Kolom        | Tipe Data       |")
    console.log("|-------------------|-----------------|")

    columns.forEach((column) => {
      const colName = column.column_name.padEnd(18)
      const dataType = column.data_type.padEnd(16)
      console.log(`| ${colName} | ${dataType} |`)
    })

    console.log("==================================")

    // Periksa apakah kolom data ada
    const hasDataColumn = columns.some((col) => col.column_name === "data")

    if (!hasDataColumn) {
      console.log('\n⚠️ Kolom "data" tidak ditemukan di tabel notification_logs')
      console.log("Anda perlu menambahkan kolom ini dengan menjalankan SQL:")
      console.log("\nALTER TABLE notification_logs ADD COLUMN data JSONB;")
    } else {
      console.log('\n✅ Kolom "data" ditemukan di tabel notification_logs')
    }
  } catch (error) {
    console.error("❌ Error tidak terduga:", error)
  }
}

// Jalankan fungsi utama
checkTableStructure()
