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
    // Periksa apakah tabel notification_logs ada
    const { data: tableExists, error: tableError } = await supabase.rpc("check_table_exists", {
      table_name: "notification_logs",
    })

    if (tableError) {
      console.error("❌ Error memeriksa tabel:", tableError)

      // Coba cara alternatif
      console.log("🔄 Mencoba cara alternatif untuk memeriksa tabel...")
      const { data: tables, error: tablesError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .eq("table_name", "notification_logs")

      if (tablesError) {
        console.error("❌ Error memeriksa tabel (cara alternatif):", tablesError)
        return
      }

      if (!tables || tables.length === 0) {
        console.error("❌ Tabel notification_logs tidak ditemukan")
        return
      }
    } else if (!tableExists) {
      console.error("❌ Tabel notification_logs tidak ditemukan")
      return
    }

    console.log("✅ Tabel notification_logs ditemukan")

    // Periksa struktur kolom
    const { data: columns, error: columnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_schema", "public")
      .eq("table_name", "notification_logs")
      .order("ordinal_position", { ascending: true })

    if (columnsError) {
      console.error("❌ Error memeriksa kolom:", columnsError)
      return
    }

    if (!columns || columns.length === 0) {
      console.error("❌ Tidak ada kolom yang ditemukan di tabel notification_logs")
      return
    }

    console.log("\n📋 Struktur tabel notification_logs:")
    console.log("==================================")
    console.log("| Nama Kolom        | Tipe Data       | Nullable |")
    console.log("|-------------------|-----------------|----------|")

    columns.forEach((column) => {
      const colName = column.column_name.padEnd(18)
      const dataType = column.data_type.padEnd(16)
      const nullable = column.is_nullable === "YES" ? "Ya" : "Tidak"
      console.log(`| ${colName} | ${dataType} | ${nullable.padEnd(8)} |`)
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

    // Periksa constraints
    const { data: constraints, error: constraintsError } = await supabase
      .from("information_schema.table_constraints")
      .select(`
        constraint_name,
        constraint_type
      `)
      .eq("table_schema", "public")
      .eq("table_name", "notification_logs")

    if (constraintsError) {
      console.error("❌ Error memeriksa constraints:", constraintsError)
      return
    }

    console.log("\n🔒 Constraints pada tabel notification_logs:")

    if (!constraints || constraints.length === 0) {
      console.log("Tidak ada constraints yang ditemukan")
    } else {
      constraints.forEach((constraint) => {
        console.log(`- ${constraint.constraint_name} (${constraint.constraint_type})`)
      })
    }
  } catch (error) {
    console.error("❌ Error tidak terduga:", error)
  }
}

// Jalankan fungsi utama
checkTableStructure()
