"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle2, CreditCard, DollarSign, FileText, RefreshCw, Settings } from "lucide-react"

interface PremiumSettings {
  price: number
  enabled: boolean
  description: string
  features: string[]
}

interface Transaction {
  id: string
  user_id: string
  plan_id: string
  amount: number
  status: string
  payment_method: string
  created_at: string
  user_email?: string
  user_name?: string
}

export default function PremiumSettings() {
  const [settings, setSettings] = useState<PremiumSettings>({
    price: 49000,
    enabled: true,
    description: "Akses ke semua fitur premium selamanya",
    features: ["Tidak ada batasan pesan", "Tema premium", "Fitur analitik lanjutan", "Prioritas dukungan pelanggan"],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [activeTab, setActiveTab] = useState("settings")

  const supabase = createClient()
  const { toast } = useToast()

  // Fungsi untuk memuat pengaturan premium dari database
  const loadSettings = async () => {
    setIsLoading(true)
    try {
      // Coba ambil dari environment variable dulu
      const envPrice = process.env.NEXT_PUBLIC_PREMIUM_PRICE
      if (envPrice) {
        setSettings((prev) => ({ ...prev, price: Number.parseInt(envPrice) }))
      }

      // Kemudian coba ambil dari database
      const { data, error } = await supabase.from("site_config").select("*").eq("type", "premium_settings").single()

      if (error) {
        if (error.code !== "PGRST116") {
          // PGRST116 adalah kode untuk "tidak ditemukan"
          console.error("Error loading premium settings:", error)
          toast({
            title: "Gagal memuat pengaturan",
            description: error.message,
            variant: "destructive",
          })
        }
        return
      }

      if (data && data.config) {
        setSettings(data.config as PremiumSettings)
      }
    } catch (error) {
      console.error("Error loading premium settings:", error)
      toast({
        title: "Gagal memuat pengaturan",
        description: "Terjadi kesalahan saat memuat pengaturan premium",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fungsi untuk menyimpan pengaturan premium ke database
  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase.from("site_config").upsert({
        type: "premium_settings",
        config: settings,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({
        title: "Pengaturan disimpan",
        description: "Pengaturan premium berhasil diperbarui",
      })
    } catch (error: any) {
      console.error("Error saving premium settings:", error)
      toast({
        title: "Gagal menyimpan pengaturan",
        description: error.message || "Terjadi kesalahan saat menyimpan pengaturan premium",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Fungsi untuk memuat transaksi premium
  const loadTransactions = async () => {
    setIsLoadingTransactions(true)
    try {
      const { data, error } = await supabase
        .from("premium_transactions")
        .select(`
          *,
          users:user_id (
            email,
            name
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Transform data to include user email and name
      const transformedData = data.map((item) => ({
        ...item,
        user_email: item.users?.email,
        user_name: item.users?.name,
      }))

      setTransactions(transformedData)
    } catch (error: any) {
      console.error("Error loading transactions:", error)
      toast({
        title: "Gagal memuat transaksi",
        description: error.message || "Terjadi kesalahan saat memuat data transaksi",
        variant: "destructive",
      })
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  // Fungsi untuk memformat tanggal
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Fungsi untuk memformat status transaksi
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
      case "settlement":
        return (
          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
            <CheckCircle2 className="h-3 w-3" />
            <span>Sukses</span>
          </div>
        )
      case "pending":
        return (
          <div className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs">
            <RefreshCw className="h-3 w-3" />
            <span>Pending</span>
          </div>
        )
      case "failed":
      case "expire":
      case "cancel":
        return (
          <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>Gagal</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded-full text-xs">
            <span>{status}</span>
          </div>
        )
    }
  }

  // Fungsi untuk memformat metode pembayaran
  const formatPaymentMethod = (method: string) => {
    if (!method) return "Tidak diketahui"

    const methodMap: Record<string, string> = {
      credit_card: "Kartu Kredit",
      gopay: "GoPay",
      shopeepay: "ShopeePay",
      bank_transfer: "Transfer Bank",
      echannel: "Mandiri Bill",
      bca_va: "BCA Virtual Account",
      bni_va: "BNI Virtual Account",
      bri_va: "BRI Virtual Account",
      permata_va: "Permata Virtual Account",
      qris: "QRIS",
      indomaret: "Indomaret",
      alfamart: "Alfamart",
      dana: "DANA",
      ovo: "OVO",
      linkaja: "LinkAja",
    }

    return methodMap[method] || method
  }

  // Fungsi untuk memformat jumlah uang
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Fungsi untuk menambah fitur baru
  const addFeature = () => {
    setSettings((prev) => ({
      ...prev,
      features: [...prev.features, ""],
    }))
  }

  // Fungsi untuk mengubah fitur
  const updateFeature = (index: number, value: string) => {
    setSettings((prev) => {
      const newFeatures = [...prev.features]
      newFeatures[index] = value
      return {
        ...prev,
        features: newFeatures,
      }
    })
  }

  // Fungsi untuk menghapus fitur
  const removeFeature = (index: number) => {
    setSettings((prev) => {
      const newFeatures = [...prev.features]
      newFeatures.splice(index, 1)
      return {
        ...prev,
        features: newFeatures,
      }
    })
  }

  // Load settings and transactions on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (activeTab === "transactions") {
      loadTransactions()
    }
  }, [activeTab])

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Pengaturan Premium</h1>

      <Tabs defaultValue="settings" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Pengaturan
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <FileText className="h-4 w-4 mr-2" />
            Transaksi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Premium</CardTitle>
              <CardDescription>Konfigurasi harga dan fitur premium</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="premium-enabled">Aktifkan Fitur Premium</Label>
                  <Switch
                    id="premium-enabled"
                    checked={settings.enabled}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enabled: checked }))}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Jika dinonaktifkan, pengguna tidak akan dapat membeli paket premium
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="premium-price">Harga Premium (Rp)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="premium-price"
                    type="number"
                    value={settings.price}
                    onChange={(e) => setSettings((prev) => ({ ...prev, price: Number.parseInt(e.target.value) }))}
                    className="pl-10"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Harga dalam Rupiah, tanpa titik atau koma (contoh: 49000 untuk Rp 49.000)
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="premium-description">Deskripsi Premium</Label>
                <Input
                  id="premium-description"
                  value={settings.description}
                  onChange={(e) => setSettings((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label>Fitur Premium</Label>
                <div className="space-y-2">
                  {settings.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Deskripsi fitur"
                      />
                      <Button variant="outline" size="icon" onClick={() => removeFeature(index)} className="shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6 6 18"></path>
                          <path d="m6 6 12 12"></path>
                        </svg>
                        <span className="sr-only">Hapus fitur</span>
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addFeature} className="w-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <path d="M5 12h14"></path>
                      <path d="M12 5v14"></path>
                    </svg>
                    Tambah Fitur
                  </Button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-500 mt-0.5"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Pengaturan Premium</p>
                  <p className="text-xs mt-1">
                    Perubahan pada pengaturan premium akan memengaruhi tampilan halaman premium dan proses pembayaran.
                    Perubahan harga hanya akan memengaruhi transaksi baru.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={loadSettings} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Reset
              </Button>
              <Button onClick={saveSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Pengaturan"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Riwayat Transaksi</CardTitle>
                  <CardDescription>Daftar semua transaksi premium</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadTransactions}
                  disabled={isLoadingTransactions}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingTransactions ? "animate-spin" : ""}`} />
                  <span>{isLoadingTransactions ? "Memuat..." : "Refresh"}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>ID Transaksi</TableHead>
                      <TableHead>Pengguna</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTransactions ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          <div className="flex justify-center">
                            <svg
                              className="animate-spin h-6 w-6 text-gray-400"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          </div>
                          <div className="mt-2">Memuat data transaksi...</div>
                        </TableCell>
                      </TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          <div className="flex justify-center">
                            <CreditCard className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="mt-2">Belum ada transaksi premium</div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-mono text-xs">{transaction.plan_id}</TableCell>
                          <TableCell>
                            <div className="font-medium">{transaction.user_name || "Tidak diketahui"}</div>
                            <div className="text-xs text-muted-foreground">{transaction.user_email}</div>
                          </TableCell>
                          <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell>{formatPaymentMethod(transaction.payment_method)}</TableCell>
                          <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          <TableCell className="text-xs">{formatDate(transaction.created_at)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
