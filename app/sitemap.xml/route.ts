import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get("host") || "localhost:3000"}`

  // Membuat sitemap indeks yang mengarah ke sitemap lain
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${encodeXML(`${baseUrl}/api/sitemap/static`)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${encodeXML(`${baseUrl}/api/sitemap/profiles`)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`

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
