"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Globe, ImageIcon, Share2, Search, FileCode, FileText, RefreshCw, Clock } from "lucide-react"

// Tambahkan import yang diperlukan untuk fitur sitemap
import { format, formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"

interface SeoConfig {
  site_title: string
  site_description: string
  site_keywords: string
  og_title: string
  og_description: string
  og_image_url: string
  favicon_url: string
  twitter_handle: string
  google_analytics_id: string
  custom_head_tags: string
}

// Tambahkan interface untuk SitemapLog
interface SitemapLog {
  id: string
  triggered_at: string
  user_count: number
  last_updated: string
  triggered_by: string
  created_at: string
}

const defaultSeoConfig: SeoConfig = {
  site_title: "SecretMe - Platform Pesan Anonim",
  site_description: "Terima pesan anonim dari siapapun dengan mudah dan aman",
  site_keywords: "pesan anonim, secret message, anonymous message, feedback anonim",
  og_title: "SecretMe - Platform Pesan Anonim Terbaik",
  og_description: "Terima pesan anonim dari siapapun dengan mudah dan aman. Daftar sekarang gratis!",
  og_image_url: "",
  favicon_url: "/favicon.ico",
  twitter_handle: "@secretme",
  google_analytics_id: "",
  custom_head_tags: "",
}

export default function SeoSettings() {
  const [config, setConfig] = useState<SeoConfig>(defaultSeoConfig)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const supabase = createClient()
  const { toast } = useToast()

  // Tambahkan state untuk fitur sitemap
  const [sitemapUrl, setSitemapUrl] = useState("")
  const [robotsUrl, setRobotsUrl] = useState("")
  const [logs, setLogs] = useState<SitemapLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  // Tambahkan useEffect untuk mengatur URL sitemap dan robots.txt
  useEffect(() => {
    fetchSeoConfig()

    // Tambahkan kode untuk sitemap
    const baseUrl = window.location.origin
    setSitemapUrl(`${baseUrl}/sitemap.xml`)
    setRobotsUrl(`${baseUrl}/robots.txt`)

    // Ambil log regenerasi sitemap
    fetchSitemapLogs()
  }, [])

  // Tambahkan fungsi untuk mengambil log sitemap
  const fetchSitemapLogs = async () => {
    setLoadingLogs(true)
    try {
      // Periksa apakah tabel sitemap_logs ada
      const { data, error } = await supabase
        .from("sitemap_logs")
        .select("*")
        .order("triggered_at", { ascending: false })
        .limit(10)

      if (error) {
        if (error.message?.includes("does not exist")) {
          console.log("Tabel sitemap_logs tidak ada")
          setLogs([])
        } else {
          console.error("Error mengambil log sitemap:", error)
          toast({
            title: "Error",
            description: "Gagal mengambil log regenerasi sitemap",
            variant: "destructive",
          })
        }
      } else {
        setLogs(data || [])
      }
    } catch (error) {
      console.error("Error mengambil log sitemap:", error)
    } finally {
      setLoadingLogs(false)
    }
  }

  // Tambahkan fungsi untuk meregenerasi sitemap
  const handleRegenerateSitemap = async () => {
    setIsSaving(true)
    try {
      // Panggil API endpoint untuk regenerasi sitemap
      const response = await fetch("/api/sitemap/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Gagal meregenerasi sitemap" }))
        throw new Error(errorData.error || "Gagal meregenerasi sitemap")
      }

      const data = await response.json()

      toast({
        title: "Sitemap diregenerasi",
        description: "Sitemap telah berhasil diregenerasi",
      })

      // Perbarui log
      fetchSitemapLogs()
    } catch (error) {
      console.error("Error meregenerasi sitemap:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Tidak dapat meregenerasi sitemap",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const fetchSeoConfig = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("site_config").select("*").eq("type", "seo").single()

      if (error) {
        if (error.code === "PGRST116") {
          // No data found, use default
          console.log("No SEO config found, using default")
        } else {
          throw error
        }
      }

      if (data?.config) {
        setConfig({ ...defaultSeoConfig, ...data.config })
      }
    } catch (error) {
      console.error("Error fetching SEO config:", error)
      toast({
        title: "Error",
        description: "Gagal memuat konfigurasi SEO",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setConfig((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase.from("site_config").upsert(
        {
          type: "seo",
          config,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "type",
        },
      )

      if (error) throw error

      toast({
        title: "Berhasil",
        description: "Konfigurasi SEO berhasil disimpan",
      })
    } catch (error) {
      console.error("Error saving SEO config:", error)
      toast({
        title: "Error",
        description: "Gagal menyimpan konfigurasi SEO",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateMetaTags = () => {
    const metaTags = `
<!-- Primary Meta Tags -->
<title>${config.site_title}</title>
<meta name="title" content="${config.site_title}">
<meta name="description" content="${config.site_description}">
<meta name="keywords" content="${config.site_keywords}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${window.location.origin}">
<meta property="og:title" content="${config.og_title}">
<meta property="og:description" content="${config.og_description}">
${config.og_image_url ? `<meta property="og:image" content="${config.og_image_url}">` : ""}

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${window.location.origin}">
<meta property="twitter:title" content="${config.og_title}">
<meta property="twitter:description" content="${config.og_description}">
${config.og_image_url ? `<meta property="twitter:image" content="${config.og_image_url}">` : ""}
${config.twitter_handle ? `<meta property="twitter:site" content="${config.twitter_handle}">` : ""}
    `.trim()

    // Copy to clipboard
    navigator.clipboard.writeText(metaTags)
    toast({
      title: "Meta Tags Disalin",
      description: "Meta tags berhasil disalin ke clipboard",
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan SEO</CardTitle>
          <CardDescription>Memuat...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan SEO & Sitemap</CardTitle>
        <CardDescription>
          Konfigurasi SEO dan Sitemap untuk meningkatkan visibilitas website di mesin pencari
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="general">
              <Globe className="h-4 w-4 mr-2" />
              Umum
            </TabsTrigger>
            <TabsTrigger value="social">
              <Share2 className="h-4 w-4 mr-2" />
              Media Sosial
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <FileCode className="h-4 w-4 mr-2" />
              Lanjutan
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Search className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="sitemap">
              <FileText className="h-4 w-4 mr-2" />
              Sitemap
            </TabsTrigger>
            <TabsTrigger value="robots">
              <Globe className="h-4 w-4 mr-2" />
              Robots.txt
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Clock className="h-4 w-4 mr-2" />
              Log Sitemap
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="site_title">Judul Website</Label>
                <Input
                  id="site_title"
                  name="site_title"
                  value={config.site_title}
                  onChange={handleChange}
                  placeholder="SecretMe - Platform Pesan Anonim"
                />
                <p className="text-xs text-muted-foreground">
                  Judul website yang akan ditampilkan di tab browser dan hasil pencarian
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_description">Deskripsi Website</Label>
                <Textarea
                  id="site_description"
                  name="site_description"
                  value={config.site_description}
                  onChange={handleChange}
                  placeholder="Terima pesan anonim dari siapapun dengan mudah dan aman"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Deskripsi singkat tentang website yang akan ditampilkan di hasil pencarian (150-160 karakter)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_keywords">Kata Kunci</Label>
                <Input
                  id="site_keywords"
                  name="site_keywords"
                  value={config.site_keywords}
                  onChange={handleChange}
                  placeholder="pesan anonim, secret message, anonymous message, feedback anonim"
                />
                <p className="text-xs text-muted-foreground">
                  Kata kunci yang relevan dengan website Anda, dipisahkan dengan koma
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="favicon_url">URL Favicon</Label>
                <Input
                  id="favicon_url"
                  name="favicon_url"
                  value={config.favicon_url}
                  onChange={handleChange}
                  placeholder="/favicon.ico"
                />
                <p className="text-xs text-muted-foreground">
                  URL untuk ikon website yang ditampilkan di tab browser (favicon)
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="og_title">Judul Open Graph</Label>
                <Input
                  id="og_title"
                  name="og_title"
                  value={config.og_title}
                  onChange={handleChange}
                  placeholder="SecretMe - Platform Pesan Anonim Terbaik"
                />
                <p className="text-xs text-muted-foreground">
                  Judul yang akan ditampilkan saat website dibagikan di media sosial
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="og_description">Deskripsi Open Graph</Label>
                <Textarea
                  id="og_description"
                  name="og_description"
                  value={config.og_description}
                  onChange={handleChange}
                  placeholder="Terima pesan anonim dari siapapun dengan mudah dan aman. Daftar sekarang gratis!"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Deskripsi yang akan ditampilkan saat website dibagikan di media sosial
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="og_image_url">URL Gambar Open Graph</Label>
                <Input
                  id="og_image_url"
                  name="og_image_url"
                  value={config.og_image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/og-image.jpg"
                />
                <p className="text-xs text-muted-foreground">
                  URL gambar yang akan ditampilkan saat website dibagikan di media sosial (disarankan 1200x630 piksel)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_handle">Twitter Handle</Label>
                <Input
                  id="twitter_handle"
                  name="twitter_handle"
                  value={config.twitter_handle}
                  onChange={handleChange}
                  placeholder="@secretme"
                />
                <p className="text-xs text-muted-foreground">Username Twitter Anda (opsional)</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="google_analytics_id">ID Google Analytics</Label>
                <Input
                  id="google_analytics_id"
                  name="google_analytics_id"
                  value={config.google_analytics_id}
                  onChange={handleChange}
                  placeholder="G-XXXXXXXXXX"
                />
                <p className="text-xs text-muted-foreground">
                  ID Google Analytics untuk melacak pengunjung website (opsional)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom_head_tags">Custom Head Tags</Label>
                <Textarea
                  id="custom_head_tags"
                  name="custom_head_tags"
                  value={config.custom_head_tags}
                  onChange={handleChange}
                  placeholder="<!-- Tambahkan tag HTML kustom di sini -->"
                  rows={5}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Tag HTML kustom yang akan ditambahkan ke bagian head website (opsional)
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Perhatian</p>
                  <p className="text-xs mt-1">
                    Pengaturan lanjutan ini memerlukan penerapan manual di kode website Anda. Gunakan tombol "Generate
                    Meta Tags" untuk mendapatkan kode yang perlu ditambahkan.
                  </p>
                </div>
              </div>

              <Button variant="outline" onClick={handleGenerateMetaTags} className="w-full sm:w-auto">
                <FileCode className="h-4 w-4 mr-2" />
                Generate Meta Tags
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Preview Hasil Pencarian Google</h3>
                <div className="border rounded-md p-4 bg-white">
                  <div className="text-blue-600 text-lg font-medium">{config.site_title}</div>
                  <div className="text-green-700 text-sm">{window.location.origin}</div>
                  <div className="text-gray-600 text-sm mt-1">{config.site_description}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Preview Open Graph (Facebook/Twitter)</h3>
                <div className="border rounded-md overflow-hidden bg-white">
                  {config.og_image_url ? (
                    <div className="h-40 bg-gray-100 flex items-center justify-center border-b">
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">Preview gambar: {config.og_image_url}</span>
                    </div>
                  ) : (
                    <div className="h-40 bg-gray-100 flex items-center justify-center border-b">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">Tidak ada gambar</span>
                    </div>
                  )}
                  <div className="p-3">
                    <div className="text-gray-500 text-xs uppercase tracking-wide">{window.location.origin}</div>
                    <div className="text-blue-700 font-medium mt-1">{config.og_title}</div>
                    <div className="text-gray-600 text-sm mt-1">{config.og_description}</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <h3 className="text-sm font-medium text-blue-800 flex items-center">
                  <Search className="h-4 w-4 mr-2" />
                  Tips SEO
                </h3>
                <ul className="mt-2 space-y-2 text-xs text-blue-700 pl-6 list-disc">
                  <li>Gunakan judul yang deskriptif dan mengandung kata kunci utama</li>
                  <li>Buat deskripsi yang menarik dan informatif (150-160 karakter)</li>
                  <li>Gunakan URL yang pendek, deskriptif, dan mengandung kata kunci</li>
                  <li>Tambahkan gambar Open Graph berkualitas tinggi (1200x630 piksel)</li>
                  <li>Pastikan website Anda responsif dan cepat dimuat</li>
                  <li>Buat konten berkualitas tinggi dan update secara berkala</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sitemap" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">URL Sitemap</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ini adalah URL sitemap Anda yang dapat dikirimkan ke Google Search Console
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(sitemapUrl)
                    toast({
                      title: "URL disalin",
                      description: "URL sitemap telah disalin ke clipboard",
                    })
                  }}
                >
                  Salin URL
                </Button>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <Input value={sitemapUrl} readOnly className="bg-white" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Regenerasi Sitemap</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sitemap diregenerasi secara otomatis setiap hari, tetapi Anda dapat memaksa regenerasi manual
                  </p>
                </div>
                <Button onClick={handleRegenerateSitemap} disabled={isSaving} className="flex items-center gap-2">
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Meregenerasi...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Regenerasi Sekarang
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Informasi</p>
                  <p className="text-xs mt-1">
                    Sitemap secara otomatis menyertakan semua halaman statis dan profil pengguna. Sitemap diperbarui
                    setiap hari pada pukul 00:00 UTC menggunakan Vercel Cron Jobs.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="robots" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">URL Robots.txt</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ini adalah URL file robots.txt Anda yang mengontrol bagian mana dari situs Anda yang dapat dirayapi
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(robotsUrl)
                    toast({
                      title: "URL disalin",
                      description: "URL robots.txt telah disalin ke clipboard",
                    })
                  }}
                >
                  Salin URL
                </Button>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <Input value={robotsUrl} readOnly className="bg-white" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="robots-content">Konten Robots.txt</Label>
                <Textarea
                  id="robots-content"
                  readOnly
                  className="font-mono text-xs h-48"
                  value={`# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Sitemap
Sitemap: ${sitemapUrl}

# Rute yang dibatasi
Disallow: /dashboard
Disallow: /admin
Disallow: /api/
Disallow: /auth/`}
                />
                <p className="text-xs text-muted-foreground">
                  Ini adalah konten saat ini dari file robots.txt Anda. Untuk memodifikasinya, edit file
                  app/robots.txt/route.ts
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <h3 className="text-sm font-medium text-blue-800 flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  Tips untuk robots.txt
                </h3>
                <ul className="mt-2 space-y-2 text-xs text-blue-700 pl-6 list-disc">
                  <li>Gunakan "Disallow: /rute/" untuk mencegah mesin pencari mengindeks halaman tertentu</li>
                  <li>Gunakan "Allow: /rute/" untuk secara eksplisit mengizinkan pengindeksan halaman tertentu</li>
                  <li>Selalu sertakan URL sitemap Anda untuk memudahkan penemuan</li>
                  <li>
                    Hindari memblokir sumber daya CSS dan JavaScript agar mesin pencari dapat merender situs Anda dengan
                    benar
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Log Regenerasi Sitemap</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Riwayat regenerasi sitemap, baik otomatis maupun manual
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSitemapLogs}
                  disabled={loadingLogs}
                  className="flex items-center gap-2"
                >
                  {loadingLogs ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Memuat...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>

              {loadingLogs ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Memuat log regenerasi...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 border rounded-md bg-gray-50">
                  <p className="text-sm text-gray-500 mb-2">Belum ada log regenerasi sitemap</p>
                  <p className="text-xs text-gray-400">
                    Log akan muncul setelah sitemap diregenerasi secara manual atau melalui cron job
                  </p>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Waktu
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jumlah Pengguna
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pembaruan Terakhir
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dipicu Oleh
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {format(new Date(log.triggered_at), "dd MMM yyyy", { locale: id })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(log.triggered_at), "HH:mm:ss", { locale: id })}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{log.user_count}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDistanceToNow(new Date(log.last_updated), { addSuffix: true, locale: id })}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                log.triggered_by === "cron"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {log.triggered_by === "cron" ? "Otomatis" : "Manual"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <h3 className="text-sm font-medium text-blue-800 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Tentang Regenerasi Otomatis
                </h3>
                <p className="mt-2 text-xs text-blue-700">
                  Sitemap diregenerasi secara otomatis setiap hari pada pukul 00:00 UTC menggunakan Vercel Cron Jobs.
                  Konfigurasi ini diatur dalam file <code className="bg-blue-100 px-1 py-0.5 rounded">vercel.json</code>{" "}
                  di root proyek Anda.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Menyimpan...
              </>
            ) : (
              "Simpan Konfigurasi"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
