import { createClient } from "@/lib/supabase/server"
import type { NextRequest } from "next/server"

// Pastikan route ini selalu dirender secara dinamis
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get("host") || "localhost:3000"}`

  try {
    const supabase = createClient()

    // Mendapatkan semua pengguna dengan username (untuk profil kustom)
    const { data: users, error } = await supabase
      .from("users")
      .select("username, numeric_id, updated_at, name")
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error mengambil data pengguna untuk sitemap:", error)
      return new Response("Error membuat sitemap", { status: 500 })
    }

    // Membuat entri untuk profil pengguna
    const userPages =
      users?.map((user) => {
        const profileUrl = `${baseUrl}/${user.username || user.numeric_id}`
        return {
          url: profileUrl,
          lastmod: user.updated_at || new Date().toISOString(),
          changefreq: "daily",
          priority: 0.6,
          name: user.name,
          username: user.username || user.numeric_id,
        }
      }) || []

    // Membuat XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${userPages
    .map(
      (page) => `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <image:image>
      <image:loc>${baseUrl}/api/og?username=${page.username}&name=${encodeURIComponent(page.name || "")}</image:loc>
      <image:title>Profil ${page.name || "Pengguna"} di SecretMe</image:title>
    </image:image>
  </url>`,
    )
    .join("")}
</urlset>`

    // Catat jumlah URL dalam sitemap
    console.log(`Sitemap profil dibuat dengan ${userPages.length} URL pada ${new Date().toISOString()}`)

    // Mengembalikan sitemap sebagai XML dengan header cache yang lebih baik
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        // Cache selama 1 jam di browser, tetapi memungkinkan revalidasi
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    })
  } catch (error) {
    console.error("Error membuat sitemap profil:", error)
    return new Response("Error membuat sitemap", { status: 500 })
  }
}
