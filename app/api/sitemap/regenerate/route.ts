import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Mendukung metode GET dan POST untuk fleksibilitas
export async function GET(request: Request) {
  return handleSitemapRegeneration(request)
}

export async function POST(request: Request) {
  return handleSitemapRegeneration(request)
}

async function handleSitemapRegeneration(request: Request) {
  // Ekstrak secret dari URL atau body tergantung metode
  let secret = ""

  try {
    // Coba dapatkan secret dari URL (untuk GET)
    const url = new URL(request.url)
    secret = url.searchParams.get("secret") || ""

    // Jika tidak ada di URL dan ini adalah POST, coba dapatkan dari body
    if (!secret && request.method === "POST") {
      const body = await request.json().catch(() => ({}))
      secret = body.secret || ""
    }
  } catch (error) {
    console.error("Error parsing request:", error)
  }

  // Verifikasi secret key untuk keamanan
  if (secret !== process.env.CRON_SECRET) {
    console.error("Unauthorized attempt to regenerate sitemap")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createClient()

    // Mendapatkan jumlah pengguna untuk statistik
    const { count: userCount, error: countError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error menghitung pengguna:", countError)
      return NextResponse.json({ error: "Error menghitung pengguna" }, { status: 500 })
    }

    // Mendapatkan waktu pembaruan terakhir
    const { data: latestUser, error: latestError } = await supabase
      .from("users")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    const lastUpdated = latestUser?.updated_at || new Date().toISOString()

    // Mencatat regenerasi sitemap
    const { error: logError } = await supabase.from("sitemap_logs").insert({
      triggered_at: new Date().toISOString(),
      user_count: userCount || 0,
      last_updated: lastUpdated,
      triggered_by: "manual",
    })

    if (logError) {
      console.error("Error mencatat log sitemap:", logError)
      // Lanjutkan meskipun ada error logging
    }

    return NextResponse.json({
      success: true,
      message: "Sitemap berhasil diregenerasi",
      timestamp: new Date().toISOString(),
      stats: {
        userCount,
        lastUpdated,
      },
    })
  } catch (error) {
    console.error("Error regenerasi sitemap:", error)
    return NextResponse.json({ error: "Error regenerasi sitemap" }, { status: 500 })
  }
}
