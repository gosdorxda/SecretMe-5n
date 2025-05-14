import type { NextRequest } from "next/server"

// Pastikan route ini selalu dirender secara dinamis
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get("host") || "localhost:3000"}`

  // Daftar halaman statis dengan prioritas dan frekuensi perubahan
  const staticPages = [
    { url: "/", changefreq: "daily", priority: 1.0 },
    { url: "/login", changefreq: "monthly", priority: 0.8 },
    { url: "/register", changefreq: "monthly", priority: 0.8 },
    { url: "/about", changefreq: "monthly", priority: 0.7 },
    { url: "/features", changefreq: "weekly", priority: 0.9 },
    { url: "/contact", changefreq: "monthly", priority: 0.7 },
    { url: "/privacy", changefreq: "monthly", priority: 0.6 },
    { url: "/terms", changefreq: "monthly", priority: 0.6 },
  ]

  // Membuat XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map(
      (page) => `
  <url>
    <loc>${encodeXML(`${baseUrl}${page.url}`)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
    )
    .join("")}
</urlset>`

  // Mengembalikan sitemap sebagai XML dengan header cache yang lebih baik
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      // Cache selama 1 jam di browser, tetapi memungkinkan revalidasi
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}

// Fungsi untuk mengenkode karakter khusus dalam XML
function encodeXML(str: string): string {
  if (!str) return ""
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
