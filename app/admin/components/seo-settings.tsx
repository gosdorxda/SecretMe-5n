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
import { AlertCircle, Globe, ImageIcon, Share2, Search, FileCode } from "lucide-react"

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

  useEffect(() => {
    fetchSeoConfig()
  }, [])

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
        <CardTitle>Pengaturan SEO</CardTitle>
        <CardDescription>Konfigurasi SEO untuk meningkatkan visibilitas website di mesin pencari</CardDescription>
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
