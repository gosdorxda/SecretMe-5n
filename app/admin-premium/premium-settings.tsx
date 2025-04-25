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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

interface TransactionDetails {
  payment_details?: {
    payment_type?: string
    transaction_time?: string
    transaction_status?: string
    transaction_id?: string
    status_message?: string
    status_code?: string
    settlement_time?: string
    payment_code?: string
    order_id?: string
    merchant_id?: string
    gross_amount?: string
    fraud_status?: string
    currency?: string
    va_numbers?: Array<{
      bank: string
      va_number: string
    }>
    qr_string?: string
    acquirer?: string
    expiry_time?: string
    bill_key?: string
    biller_code?: string
    permata_va_number?: string
  }
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
  const [activeTab, setActiveTab] = useState("transactions")
  const [selectedTransaction, setSelectedTransaction] = useState<(Transaction & TransactionDetails) | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [revenue, setRevenue] = useState(0)
  const [transactionCount, setTransactionCount] = useState(0)
  const [paymentConfig, setPaymentConfig] = useState<any>({
    activeGateway: "duitku",
    gateways: {
      duitku: {
        merchantCode: "",
        apiKey: "",
        isProduction: true,
      },
    },
  })
  const [isSavingPaymentConfig, setIsSavingPaymentConfig] = useState(false)

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
      const { data, error, count } = await supabase
        .from("premium_transactions")
        .select(
          `
         *,
         users:user_id (
           email,
           name,
           username
         ),
         payment_details
       `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })

      if (error) throw error

      // Transform data to include user email and name
      const transformedData = data.map((item) => ({
        ...item,
        user_email: item.users?.email,
        user_name: item.users?.name,
      }))

      setTransactions(transformedData)
      setTransactionCount(count || 0)

      // Calculate total revenue
      const totalRevenue = transformedData.reduce((acc, curr) => {
        if (curr.status === "success") {
          return acc + curr.amount
        }
        return acc
      }, 0)
      setRevenue(totalRevenue)
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

  // Fungsi untuk memuat konfigurasi pembayaran
  const loadPaymentConfig = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("site_config")
        .select("config")
        .eq("type", "payment_gateway_config")
        .single()

      if (error) {
        if (error.code !== "PGRST116") {
          console.error("Error loading payment config:", error)
          toast({
            title: "Gagal memuat konfigurasi pembayaran",
            description: error.message || "Terjadi kesalahan saat memuat konfigurasi pembayaran",
            variant: "destructive",
          })
        }
        // Tetap gunakan default config jika tidak ada di database
        return
      }

      if (data && data.config) {
        console.log("Loaded payment config:", data.config)
        setPaymentConfig(data.config)
      }
    } catch (error: any) {
      console.error("Error loading payment config:", error)
      toast({
        title: "Gagal memuat konfigurasi pembayaran",
        description: error.message || "Terjadi kesalahan saat memuat konfigurasi pembayaran",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fungsi untuk menyimpan konfigurasi pembayaran
  const savePaymentConfigSettings = async () => {
    setIsSavingPaymentConfig(true)
    try {
      // Simpan ke database
      const { error } = await supabase.from("site_config").upsert(
        {
          type: "payment_gateway_config",
          config: paymentConfig,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "type" },
      )

      if (error) {
        console.error("Error saving payment config:", error)
        toast({
          title: "Gagal menyimpan konfigurasi pembayaran",
          description: error.message || "Terjadi kesalahan saat menyimpan konfigurasi pembayaran",
          variant: "destructive",
        })
        return
      }

      console.log("Saved payment config:", paymentConfig)
      toast({
        title: "Konfigurasi pembayaran disimpan",
        description: "Konfigurasi pembayaran berhasil diperbarui",
      })
    } catch (error: any) {
      console.error("Error saving payment config:", error)
      toast({
        title: "Gagal menyimpan konfigurasi pembayaran",
        description: error.message || "Terjadi kesalahan saat menyimpan konfigurasi pembayaran",
        variant: "destructive",
      })
    } finally {
      setIsSavingPaymentConfig(false)
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

  const openTransactionDetails = async (transaction: Transaction) => {
    try {
      // Ambil detail lengkap transaksi dari database
      const { data, error } = await supabase
        .from("premium_transactions")
        .select("*, users:user_id(email, name, username)")
        .eq("id", transaction.id)
        .single()

      if (error) throw error

      setSelectedTransaction(data)
      setIsDialogOpen(true)
    } catch (error: any) {
      console.error("Error loading transaction details:", error)
      toast({
        title: "Gagal memuat detail",
        description: error.message || "Terjadi kesalahan saat memuat detail transaksi",
        variant: "destructive",
      })
    }
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
    loadPaymentConfig()
  }, [])

  useEffect(() => {
    if (activeTab === "transactions") {
      loadTransactions()
    }
  }, [activeTab])

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Pengaturan Premium</h1>

      <Tabs defaultValue="transactions" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="transactions">
            <FileText className="h-4 w-4 mr-2" />
            Transaksi
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Pengaturan
          </TabsTrigger>
          <TabsTrigger value="payment-gateways">
            <CreditCard className="h-4 w-4 mr-2" />
            Payment Gateways
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="premium-enabled">Aktifkan Premium</Label>
                  <div className="space-y-1">
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
                            className="mr-2"
                          >
                            <path d="M5 12h14"></path>
                            <path d="M12 5v14"></path>
                          </svg>
                          Hapus
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

        <TabsContent value="payment-gateways">
          <Card>
            <CardHeader>
              <CardTitle>Konfigurasi Payment Gateways</CardTitle>
              <CardDescription>Atur konfigurasi untuk berbagai payment gateways</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Memuat konfigurasi...</div>
              ) : (
                <div className="space-y-4">
                  {/* Duitku Settings */}
                  <div>
                    <h3 className="text-lg font-medium">Duitku</h3>
                    <div className="space-y-2">
                      <Label htmlFor="duitku-merchant-code">Merchant Code</Label>
                      <Input
                        id="duitku-merchant-code"
                        value={paymentConfig?.gateways?.duitku?.merchantCode || ""}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            gateways: {
                              ...paymentConfig?.gateways,
                              duitku: {
                                ...paymentConfig?.gateways?.duitku,
                                merchantCode: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duitku-api-key">API Key</Label>
                      <Input
                        id="duitku-api-key"
                        type="password"
                        value={paymentConfig?.gateways?.duitku?.apiKey || ""}
                        onChange={(e) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            gateways: {
                              ...paymentConfig?.gateways,
                              duitku: {
                                ...paymentConfig?.gateways?.duitku,
                                apiKey: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch
                        id="duitku-is-production"
                        checked={paymentConfig?.gateways?.duitku?.isProduction !== false}
                        onCheckedChange={(checked) =>
                          setPaymentConfig({
                            ...paymentConfig,
                            gateways: {
                              ...paymentConfig?.gateways,
                              duitku: {
                                ...paymentConfig?.gateways?.duitku,
                                isProduction: checked,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="duitku-is-production">Mode Produksi</Label>
                    </div>
                    <div className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
                      <p>
                        <strong>Catatan:</strong> Pastikan Merchant Code dan API Key yang dimasukkan sudah benar. Untuk
                        pengujian, gunakan mode Sandbox (nonaktifkan Mode Produksi).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={savePaymentConfigSettings} disabled={isSavingPaymentConfig}>
                {isSavingPaymentConfig ? (
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
                  "Simpan Konfigurasi"
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
              <div className="mb-4">
                <h3 className="text-lg font-medium">Informasi Sekilas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-700">Total Pendapatan</p>
                          <p className="text-xl font-bold">{formatCurrency(revenue)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-700">Total Transaksi</p>
                          <p className="text-xl font-bold">{transactionCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>ID Transaksi</TableHead>
                      <TableHead className="min-w-[150px]">Pengguna</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTransactions ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openTransactionDetails(transaction)}
                              className="h-8 px-2"
                            >
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
                                className="mr-1"
                              >
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.3-4.3"></path>
                              </svg>
                              Detail
                            </Button>
                          </TableCell>
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

      {/* Dialog Detail Transaksi */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
            <DialogDescription>Informasi lengkap tentang transaksi premium</DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6 py-4">
              {/* Informasi Dasar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">ID Transaksi</h3>
                    <p className="font-mono text-sm">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Order ID</h3>
                    <p className="font-mono text-sm">{selectedTransaction.plan_id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Jumlah</h3>
                    <p className="font-medium">{formatCurrency(selectedTransaction.amount)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Pengguna</h3>
                    <p>{selectedTransaction.users?.name || "Tidak diketahui"}</p>
                    <p className="text-sm text-muted-foreground">{selectedTransaction.users?.email}</p>
                    {selectedTransaction.users?.username && (
                      <p className="text-sm text-muted-foreground">@{selectedTransaction.users.username}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Metode Pembayaran</h3>
                    <p>{formatPaymentMethod(selectedTransaction.payment_method)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Tanggal Transaksi</h3>
                    <p>{formatDate(selectedTransaction.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Detail Pembayaran */}
              {selectedTransaction.payment_details && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Detail Pembayaran</h3>
                    <div className="bg-gray-50 rounded-md p-4 overflow-x-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Payment Type */}
                        {selectedTransaction.payment_details.payment_type && (
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Tipe Pembayaran</h4>
                            <p className="text-sm">{selectedTransaction.payment_details.payment_type}</p>
                          </div>
                        )}

                        {/* Transaction Time */}
                        {selectedTransaction.payment_details.transaction_time && (
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Waktu Transaksi</h4>
                            <p className="text-sm">
                              {new Date(selectedTransaction.payment_details.transaction_time).toLocaleString("id-ID")}
                            </p>
                          </div>
                        )}

                        {/* Settlement Time */}
                        {selectedTransaction.payment_details.settlement_time && (
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Waktu Settlement</h4>
                            <p className="text-sm">
                              {new Date(selectedTransaction.payment_details.settlement_time).toLocaleString("id-ID")}
                            </p>
                          </div>
                        )}

                        {/* Expiry Time */}
                        {selectedTransaction.payment_details.expiry_time && (
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Waktu Kadaluarsa</h4>
                            <p className="text-sm">
                              {new Date(selectedTransaction.payment_details.expiry_time).toLocaleString("id-ID")}
                            </p>
                          </div>
                        )}

                        {/* Transaction Status */}
                        {selectedTransaction.payment_details.transaction_status && (
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Status Transaksi</h4>
                            <p className="text-sm">{selectedTransaction.payment_details.transaction_status}</p>
                          </div>
                        )}

                        {/* Fraud Status */}
                        {selectedTransaction.payment_details.fraud_status && (
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Status Fraud</h4>
                            <p className="text-sm">{selectedTransaction.payment_details.fraud_status}</p>
                          </div>
                        )}

                        {/* Status Code */}
                        {selectedTransaction.payment_details.status_code && (
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Kode Status</h4>
                            <p className="text-sm">{selectedTransaction.payment_details.status_code}</p>
                          </div>
                        )}

                        {/* Status Message */}
                        {selectedTransaction.payment_details.status_message && (
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Pesan Status</h4>
                            <p className="text-sm">{selectedTransaction.payment_details.status_message}</p>
                          </div>
                        )}

                        {/* Merchant ID */}
                        {selectedTransaction.payment_details.merchant_id && (
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">ID Merchant</h4>
                            <p className="text-sm font-mono">{selectedTransaction.payment_details.merchant_id}</p>
                          </div>
                        )}

                        {/* Currency */}
                        {selectedTransaction.payment_details.currency && (
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Mata Uang</h4>
                            <p className="text-sm">{selectedTransaction.payment_details.currency}</p>
                          </div>
                        )}
                      </div>

                      {/* Virtual Account Numbers */}
                      {selectedTransaction.payment_details.va_numbers &&
                        selectedTransaction.payment_details.va_numbers.length > 0 && (
                          <div className="mt-4 border-t pt-3">
                            <h4 className="text-xs font-medium text-muted-foreground mb-2">Virtual Account</h4>
                            {selectedTransaction.payment_details.va_numbers.map((va, index) => (
                              <div key={index} className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{va.bank.toUpperCase()}:</span>
                                <span className="text-sm font-mono">{va.va_number}</span>
                              </div>
                            ))}
                          </div>
                        )}

                      {/* Permata VA */}
                      {selectedTransaction.payment_details.permata_va_number && (
                        <div className="mt-4 border-t pt-3">
                          <h4 className="text-xs font-medium text-muted-foreground mb-2">Permata Virtual Account</h4>
                          <span className="text-sm font-mono">
                            {selectedTransaction.payment_details.permata_va_number}
                          </span>
                        </div>
                      )}

                      {/* Bill Payment */}
                      {selectedTransaction.payment_details.bill_key &&
                        selectedTransaction.payment_details.biller_code && (
                          <div className="mt-4 border-t pt-3">
                            <h4 className="text-xs font-medium text-muted-foreground mb-2">Mandiri Bill Payment</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-xs text-muted-foreground">Biller Code:</span>
                                <span className="text-sm font-mono ml-1">
                                  {selectedTransaction.payment_details.biller_code}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Bill Key:</span>
                                <span className="text-sm font-mono ml-1">
                                  {selectedTransaction.payment_details.bill_key}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Payment Code (Alfamart/Indomaret) */}
                      {selectedTransaction.payment_details.payment_code && (
                        <div className="mt-4 border-t pt-3">
                          <h4 className="text-xs font-medium text-muted-foreground mb-2">Kode Pembayaran</h4>
                          <span className="text-sm font-mono">{selectedTransaction.payment_details.payment_code}</span>
                        </div>
                      )}

                      {/* QR String */}
                      {selectedTransaction.payment_details.qr_string && (
                        <div className="mt-4 border-t pt-3">
                          <h4 className="text-xs font-medium text-muted-foreground mb-2">QRIS Data</h4>
                          <div className="max-w-full overflow-hidden">
                            <p className="text-xs font-mono truncate">
                              {selectedTransaction.payment_details.qr_string}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Tombol Aksi */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
