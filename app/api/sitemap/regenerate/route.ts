import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // Cek session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verifikasi user dengan getUser()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Error verifying user:", userError)
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }

  // Verifikasi apakah user adalah admin
  const { data: adminData } = await supabase.from("users").select("email").eq("id", user.id).single()

  const adminEmails = ["gosdorxda@gmail.com"] // Ganti dengan email admin Anda

  if (!adminEmails.includes(adminData?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Proses request
  try {
    // Verifikasi rahasia untuk memastikan hanya cron job yang berwenang yang dapat memanggil API ini
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")

    if (secret !== process.env.CRON_SECRET) {
      console.error("Upaya regenerasi sitemap tidak sah dengan rahasia yang salah")
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 })
    }

    // Dapatkan statistik saat ini
    // const supabase = createClient() // Use supabase from auth-helpers

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
        triggered_by: "cron",
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
