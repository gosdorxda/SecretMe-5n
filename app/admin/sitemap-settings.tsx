"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, FileText, RefreshCw, Globe, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format, formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"

interface SitemapLog {
  id: string
  triggered_at: string
  user_count: number
  last_updated: string
  triggered_by: string
  created_at: string
}

export default function SitemapSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [sitemapUrl, setSitemapUrl] = useState("")
  const [robotsUrl, setRobotsUrl] = useState("")
  const [logs, setLogs] = useState<SitemapLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  // Menetapkan URL saat komponen dimuat
  useEffect(() => {
    const baseUrl = window.location.origin
    setSitemapUrl(`${baseUrl}/sitemap.xml`)
    setRobotsUrl(`${baseUrl}/robots.txt`)

    // Ambil log regenerasi sitemap
    fetchSitemapLogs()
  }, [])

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

  const handleRegenerateSitemap = async () => {
    setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-500" />
          Pengaturan Sitemap
        </CardTitle>
        <CardDescription>
          Kelola pengaturan sitemap.xml dan robots.txt untuk meningkatkan pengindeksan di mesin pencari
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sitemap">
          <TabsList className="mb-4">
            <TabsTrigger value="sitemap">
              <FileText className="h-4 w-4 mr-2" />
              Sitemap.xml
            </TabsTrigger>
            <TabsTrigger value="robots">
              <Globe className="h-4 w-4 mr-2" />
              Robots.txt
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Clock className="h-4 w-4 mr-2" />
              Log Regenerasi
            </TabsTrigger>
          </TabsList>

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
                <Button onClick={handleRegenerateSitemap} disabled={isLoading} className="flex items-center gap-2">
                  {isLoading ? (
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
      </CardContent>
    </Card>
  )
}
