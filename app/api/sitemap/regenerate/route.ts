import { createClient } from "@/lib/supabase/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  // Verifikasi secret key untuk keamanan
  const secretKey = request.nextUrl.searchParams.get("secret")
  if (secretKey !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const supabase = createClient()

    // Mendapatkan jumlah pengguna untuk statistik
    const { count: userCount, error: countError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error menghitung pengguna:", countError)
      return new Response("Error menghitung pengguna", { status: 500 })
    }

    // Mencatat regenerasi sitemap
    const { error: logError } = await supabase.from("sitemap_logs").insert({
      triggered_at: new Date().toISOString(),
      user_count: userCount || 0,
      triggered_by: "cron",
    })

    if (logError) {
      console.error("Error mencatat log sitemap:", logError)
      return new Response("Error mencatat log sitemap", { status: 500 })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sitemap berhasil diregenerasi",
        timestamp: new Date().toISOString(),
        userCount,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("Error regenerasi sitemap:", error)
    return new Response("Error regenerasi sitemap", { status: 500 })
  }
}
