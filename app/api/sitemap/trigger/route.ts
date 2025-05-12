import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Periksa apakah pengguna adalah admin
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verifikasi pengguna dengan getUser()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Error verifying user:", authError)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    // Periksa apakah pengguna adalah admin
    const { data: userData } = await supabase.from("users").select("email").eq("id", user.id).single()

    // Daftar email admin (dalam implementasi nyata, ini sebaiknya disimpan di database)
    const adminEmails = ["gosdorxda@gmail.com"] // Ganti dengan email admin Anda

    if (!adminEmails.includes(userData?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Dapatkan statistik saat ini
    // Hitung jumlah pengguna
    const { count: userCount, error: userError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })

    if (userError) {
      console.error("Error menghitung pengguna:", userError)
    }

    // Dapatkan waktu pembaruan terakhir
    const { data: latestUser, error: latestError } = await supabase
      .from("users")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    const lastUpdated = latestUser?.updated_at || new Date().toISOString()

    // Catat informasi regenerasi
    const timestamp = new Date().toISOString()
    console.log(`Regenerasi sitemap dipicu pada ${timestamp}`)
    console.log(`Jumlah pengguna dalam sitemap: ${userCount || "tidak diketahui"}`)
    console.log(`Pembaruan terakhir: ${lastUpdated}`)

    // Opsional: Simpan log regenerasi di database
    try {
      await supabase.from("sitemap_logs").insert({
        triggered_at: timestamp,
        user_count: userCount || 0,
        last_updated: lastUpdated,
        triggered_by: "manual",
      })
    } catch (logError) {
      // Jika tabel tidak ada, abaikan error
      console.warn("Tidak dapat mencatat regenerasi sitemap:", logError)
    }

    return NextResponse.json({
      success: true,
      message: "Regenerasi sitemap berhasil dipicu",
      stats: {
        timestamp,
        userCount,
        lastUpdated,
      },
    })
  } catch (error) {
    console.error("Error meregenerasi sitemap:", error)
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 })
  }
}
