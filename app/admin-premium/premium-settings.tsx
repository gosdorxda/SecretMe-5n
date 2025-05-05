"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileText,
  RefreshCw,
  Search,
  Calendar,
  TrendingUp,
  Users,
  Filter,
  Download,
  BarChart4,
  PieChart,
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
  Save,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PremiumSettings {
  price: number
  activeGateway: string
  paypalBusinessEmail?: string
  paypalMode?: string
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
  }
}

interface PaymentStats {
  totalRevenue: number
  totalTransactions: number
  successRate: number
  averageAmount: number
  recentTransactions: number
  pendingTransactions: number
  failedTransactions: number
  paymentMethodBreakdown: Record<string, number>
  dailyRevenue: Array<{ date: string; amount: number }>
}

export default function PremiumSettings() {
  const [settings, setSettings] = useState<PremiumSettings>({
    price: Number.parseInt(process.env.NEXT_PUBLIC_PREMIUM_PRICE || "49000", 10),
    activeGateway: process.env.NEXT_PUBLIC_ACTIVE_PAYMENT_GATEWAY || "duitku",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [activeTab, setActiveTab] = useState("transactions")
  const [selectedTransaction, setSelectedTransaction] = useState<(Transaction & TransactionDetails) | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [revenue, setRevenue] = useState(0)
  const [transactionCount, setTransactionCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [dateRangeFilter, setDateRangeFilter] = useState("all")
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalRevenue: 0,
    totalTransactions: 0,
    successRate: 0,
    averageAmount: 0,
    recentTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    paymentMethodBreakdown: {},
    dailyRevenue: [],
  })
  const [isStatsLoading, setIsStatsLoading] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()

  // Fungsi untuk memuat pengaturan premium dari database
  const loadSettings = async () => {
    setIsLoading(true)
    try {
      // Ambil pengaturan dari database
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
        setSettings({
          price: data.config.price || Number.parseInt(process.env.NEXT_PUBLIC_PREMIUM_PRICE || "49000", 10),
          activeGateway: data.config.activeGateway || process.env.NEXT_PUBLIC_ACTIVE_PAYMENT_GATEWAY || "duitku",
          paypalBusinessEmail: data.config.paypalBusinessEmail || "",
          paypalMode: data.config.paypalMode || "sandbox",
        })
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
      const { error } = await supabase.from("site_config").upsert(
        {
          type: "premium_settings",
          config: settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "type" },
      )

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

      // Tambahkan logging untuk memeriksa data yang diambil:
      console.log("Fetched transactions:", transformedData)
      // Periksa apakah payment_details ada dan valid
      transformedData.forEach((transaction, index) => {
        console.log(
          `Transaction ${index} payment_details:`,
          transaction.payment_details,
          "Type:",
          typeof transaction.payment_details,
          "Is null:",
          transaction.payment_details === null,
          "Is empty object:",
          Object.keys(transaction.payment_details || {}).length === 0,
        )
      })

      setTransactions(transformedData)
      setFilteredTransactions(transformedData)
      setTransactionCount(count || 0)

      // Calculate total revenue
      const totalRevenue = transformedData.reduce((acc, curr) => {
        if (curr.status === "success") {
          return acc + curr.amount
        }
        return acc
      }, 0)
      setRevenue(totalRevenue)

      // Load payment stats
      loadPaymentStats(transformedData)
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

  // Fungsi untuk memuat statistik pembayaran
  const loadPaymentStats = (transactionData: Transaction[]) => {
    setIsStatsLoading(true)
    try {
      // Total revenue (hanya dari transaksi sukses)
      const totalRevenue = transactionData.reduce((acc, curr) => {
        if (curr.status === "success" || curr.status === "settlement") {
          return acc + curr.amount
        }
        return acc
      }, 0)

      // Total transactions
      const totalTransactions = transactionData.length

      // Success rate
      const successfulTransactions = transactionData.filter(
        (t) => t.status === "success" || t.status === "settlement",
      ).length
      const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0

      // Average transaction amount
      const averageAmount = successfulTransactions > 0 ? totalRevenue / successfulTransactions : 0

      // Recent transactions (last 7 days)
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const recentTransactions = transactionData.filter((t) => new Date(t.created_at) >= oneWeekAgo).length

      // Pending transactions
      const pendingTransactions = transactionData.filter((t) => t.status === "pending").length

      // Failed transactions
      const failedTransactions = transactionData.filter(
        (t) => t.status === "failed" || t.status === "expire" || t.status === "cancel",
      ).length

      // Payment method breakdown
      const paymentMethodBreakdown: Record<string, number> = {}
      transactionData.forEach((t) => {
        if (t.payment_method) {
          if (paymentMethodBreakdown[t.payment_method]) {
            paymentMethodBreakdown[t.payment_method]++
          } else {
            paymentMethodBreakdown[t.payment_method] = 1
          }
        }
      })

      // Daily revenue for the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Initialize daily revenue map
      const dailyRevenueMap = new Map<string, number>()
      for (let i = 0; i < 30; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateString = date.toISOString().split("T")[0]
        dailyRevenueMap.set(dateString, 0)
      }

      // Fill in revenue data
      transactionData.forEach((t) => {
        if ((t.status === "success" || t.status === "settlement") && t.created_at) {
          const transactionDate = new Date(t.created_at).toISOString().split("T")[0]
          if (dailyRevenueMap.has(transactionDate)) {
            dailyRevenueMap.set(transactionDate, (dailyRevenueMap.get(transactionDate) || 0) + t.amount)
          }
        }
      })

      // Convert map to array for easier rendering
      const dailyRevenue = Array.from(dailyRevenueMap.entries())
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setPaymentStats({
        totalRevenue,
        totalTransactions,
        successRate,
        averageAmount,
        recentTransactions,
        pendingTransactions,
        failedTransactions,
        paymentMethodBreakdown,
        dailyRevenue,
      })
    } catch (error) {
      console.error("Error calculating payment stats:", error)
    } finally {
      setIsStatsLoading(false)
    }
  }

  // Fungsi untuk memfilter transaksi
  const filterTransactions = () => {
    let filtered = [...transactions]

    // Filter by search query (plan_id, user_email, user_name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          (t.plan_id && t.plan_id.toLowerCase().includes(query)) ||
          (t.user_email && t.user_email.toLowerCase().includes(query)) ||
          (t.user_name && t.user_name.toLowerCase().includes(query)),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter)
    }

    // Filter by payment method
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter((t) => t.payment_method === paymentMethodFilter)
    }

    // Filter by date range
    if (dateRangeFilter !== "all") {
      const now = new Date()
      let startDate: Date

      switch (dateRangeFilter) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0))
          break
        case "yesterday":
          startDate = new Date(now)
          startDate.setDate(startDate.getDate() - 1)
          startDate.setHours(0, 0, 0, 0)
          const endOfYesterday = new Date(startDate)
          endOfYesterday.setHours(23, 59, 59, 999)
          filtered = filtered.filter((t) => {
            const date = new Date(t.created_at)
            return date >= startDate && date <= endOfYesterday
          })
          return
        case "last7days":
          startDate = new Date(now)
          startDate.setDate(startDate.getDate() - 7)
          break
        case "last30days":
          startDate = new Date(now)
          startDate.setDate(startDate.getDate() - 30)
          break
        case "thisMonth":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case "lastMonth":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
          filtered = filtered.filter((t) => {
            const date = new Date(t.created_at)
            return date >= startDate && date <= endOfLastMonth
          })
          return
        default:
          startDate = new Date(0) // Beginning of time
      }

      filtered = filtered.filter((t) => new Date(t.created_at) >= startDate)
    }

    setFilteredTransactions(filtered)
  }

  // Fungsi untuk mengekspor data transaksi ke CSV
  const exportTransactionsToCSV = () => {
    try {
      // Buat header CSV
      const headers = [
        "ID Transaksi",
        "Order ID",
        "Nama Pengguna",
        "Email",
        "Jumlah",
        "Metode Pembayaran",
        "Status",
        "Tanggal",
      ].join(",")

      // Buat baris data
      const rows = filteredTransactions.map((t) =>
        [
          t.id,
          t.plan_id,
          `"${t.user_name || "Tidak diketahui"}"`, // Gunakan tanda kutip untuk menghindari masalah dengan koma
          `"${t.user_email || ""}"`,
          t.amount,
          `"${formatPaymentMethod(t.payment_method)}"`,
          `"${t.status}"`,
          `"${formatDate(t.created_at)}"`,
        ].join(","),
      )

      // Gabungkan header dan baris
      const csv = [headers, ...rows].join("\n")

      // Buat blob dan download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `transaksi-premium-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Ekspor Berhasil",
        description: "Data transaksi berhasil diekspor ke CSV",
      })
    } catch (error) {
      console.error("Error exporting transactions:", error)
      toast({
        title: "Gagal Mengekspor Data",
        description: "Terjadi kesalahan saat mengekspor data transaksi",
        variant: "destructive",
      })
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
        .select("*, users:user_id(email, name, username), payment_details")
        .eq("id", transaction.id)
        .single()

      if (error) throw error

      // Tambahkan di fungsi openTransactionDetails atau fungsi serupa
      console.log("Selected transaction:", data)
      console.log(
        "Payment details:",
        data.payment_details,
        "Type:",
        typeof data.payment_details,
        "Is null:",
        data.payment_details === null,
        "Is empty object:",
        Object.keys(data.payment_details || {}).length === 0,
      )

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

  // Fungsi untuk mendapatkan daftar metode pembayaran unik
  const getUniquePaymentMethods = () => {
    const methods = new Set<string>()
    transactions.forEach((t) => {
      if (t.payment_method) {
        methods.add(t.payment_method)
      }
    })
    return Array.from(methods)
  }

  // Effect untuk memfilter transaksi saat filter berubah
  useEffect(() => {
    filterTransactions()
  }, [searchQuery, statusFilter, paymentMethodFilter, dateRangeFilter, transactions])

  // Load settings and transactions on component mount
  useEffect(() => {
    loadSettings()
    if (activeTab === "transactions" || activeTab === "statistics") {
      loadTransactions()
    }
  }, [activeTab])

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Pengaturan Premium</h1>

      {/* Informasi konfigurasi dari env */}
      <Card className="mb-6">
        <CardContent className="pt-6 pb-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-medium">Konfigurasi API Gateway</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Kredensial API gateway (API key, private key, merchant code) diambil dari environment variables.
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Untuk mengubah kredensial API, perbarui environment variables dan deploy ulang aplikasi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs untuk Transaksi, Statistik, dan Pengaturan */}
      <Tabs defaultValue="transactions" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="transactions">
            <FileText className="h-4 w-4 mr-2" />
            Transaksi
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart4 className="h-4 w-4 mr-2" />
            Statistik
          </TabsTrigger>
          <TabsTrigger value="settings">
            <CreditCard className="h-4 w-4 mr-2" />
            Pengaturan
          </TabsTrigger>
        </TabsList>

        {/* Tab Pengaturan */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Premium</CardTitle>
              <CardDescription>Konfigurasi harga dan gateway pembayaran</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
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
                  <Label htmlFor="active-gateway">Gateway Pembayaran Aktif</Label>
                  <Select
                    value={settings.activeGateway}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, activeGateway: value }))}
                  >
                    <SelectTrigger id="active-gateway">
                      <SelectValue placeholder="Pilih Gateway" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="duitku">Duitku</SelectItem>
                      <SelectItem value="tripay">TriPay</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Gateway yang dipilih akan digunakan untuk semua transaksi baru
                  </p>
                </div>

                {/* Tambahkan bagian konfigurasi PayPal di halaman admin */}
                {/* Cari bagian yang menampilkan pengaturan gateway dan tambahkan PayPal */}

                {/* Contoh: */}
                {/* Setelah pengaturan gateway yang ada, tambahkan: */}
                <div className="grid gap-4 mt-6">
                  <h3 className="text-lg font-medium">Konfigurasi PayPal</h3>

                  <div className="grid gap-2">
                    <Label htmlFor="paypal_business_email">PayPal Business Email</Label>
                    <Input
                      id="paypal_business_email"
                      value={settings.paypalBusinessEmail || ""}
                      onChange={(e) => setSettings((prev) => ({ ...prev, paypalBusinessEmail: e.target.value }))}
                      placeholder="your-business@example.com"
                    />
                    <p className="text-sm text-muted-foreground">Email bisnis PayPal Anda untuk menerima pembayaran</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="paypal_mode">Mode PayPal</Label>
                    <Select
                      value={settings.paypalMode || "sandbox"}
                      onValueChange={(value) => setSettings((prev) => ({ ...prev, paypalMode: value }))}
                    >
                      <SelectTrigger id="paypal_mode">
                        <SelectValue placeholder="Pilih mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Mode sandbox untuk pengujian, production untuk pembayaran nyata
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2 mt-4">
                  <AlertCircle className="text-amber-500 mt-0.5 h-5 w-5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Perubahan Pengaturan</p>
                    <p className="text-xs mt-1">
                      Perubahan pada pengaturan ini akan disimpan ke database dan akan digunakan untuk transaksi baru.
                      Perubahan ini tidak akan mengubah environment variables.
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
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Pengaturan
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <div className="space-y-6">
            {/* Statistik Utama */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Total Pendapatan</p>
                      <p className="text-2xl font-bold mt-1">{formatCurrency(paymentStats.totalRevenue)}</p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Transaksi</p>
                      <p className="text-2xl font-bold mt-1">{paymentStats.totalTransactions}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Tingkat Keberhasilan</p>
                      <p className="text-2xl font-bold mt-1">{paymentStats.successRate.toFixed(1)}%</p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-700">Rata-rata Transaksi</p>
                      <p className="text-2xl font-bold mt-1">{formatCurrency(paymentStats.averageAmount)}</p>
                    </div>
                    <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <BarChart4 className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Statistik Sekunder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{paymentStats.recentTransactions}</div>
                    <div className="text-sm text-muted-foreground">7 hari terakhir</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {paymentStats.recentTransactions > 0
                      ? `${((paymentStats.recentTransactions / paymentStats.totalTransactions) * 100).toFixed(1)}% dari total transaksi`
                      : "Belum ada transaksi dalam 7 hari terakhir"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Transaksi Tertunda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{paymentStats.pendingTransactions}</div>
                    <div className="flex items-center text-yellow-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-sm">Menunggu Pembayaran</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {paymentStats.pendingTransactions > 0
                      ? `${((paymentStats.pendingTransactions / paymentStats.totalTransactions) * 100).toFixed(1)}% dari total transaksi`
                      : "Tidak ada transaksi tertunda"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Transaksi Gagal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{paymentStats.failedTransactions}</div>
                    <div className="flex items-center text-red-500">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">Gagal/Kadaluarsa</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {paymentStats.failedTransactions > 0
                      ? `${((paymentStats.failedTransactions / paymentStats.totalTransactions) * 100).toFixed(1)}% dari total transaksi`
                      : "Tidak ada transaksi gagal"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Grafik dan Analisis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Metode Pembayaran</CardTitle>
                  <CardDescription>Distribusi metode pembayaran yang digunakan</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(paymentStats.paymentMethodBreakdown).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(paymentStats.paymentMethodBreakdown)
                        .sort(([, countA], [, countB]) => countB - countA)
                        .map(([method, count]) => (
                          <div key={method} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{formatPaymentMethod(method)}</span>
                              <span className="text-sm text-muted-foreground">
                                {count} ({((count / paymentStats.totalTransactions) * 100).toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(count / paymentStats.totalTransactions) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <PieChart className="h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-muted-foreground">Belum ada data metode pembayaran</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pengguna Premium</CardTitle>
                  <CardDescription>Informasi pengguna premium</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Total Pengguna Premium</p>
                        <p className="text-2xl font-bold mt-1">
                          {paymentStats.totalTransactions > 0 ? paymentStats.totalTransactions : 0}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Pengguna Premium Terbaru</h4>
                      {transactions.filter((t) => t.status === "success" || t.status === "settlement").length > 0 ? (
                        <div className="space-y-2">
                          {transactions
                            .filter((t) => t.status === "success" || t.status === "settlement")
                            .slice(0, 3)
                            .map((t) => (
                              <div key={t.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                <div>
                                  <p className="font-medium">{t.user_name || "Tidak diketahui"}</p>
                                  <p className="text-xs text-muted-foreground">{t.user_email}</p>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(t.created_at).toLocaleDateString("id-ID")}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">Belum ada pengguna premium</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Riwayat Transaksi</CardTitle>
                  <CardDescription>Daftar semua transaksi premium</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportTransactionsToCSV}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>Ekspor CSV</span>
                  </Button>
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Informasi Sekilas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-purple-700">Pengguna Premium</p>
                          <p className="text-xl font-bold">
                            {transactions.filter((t) => t.status === "success" || t.status === "settlement").length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Filter dan Pencarian */}
              <div className="mb-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Cari berdasarkan ID, email, atau nama..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Filter className="h-4 w-4" />
                          <span>Filter</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-4">
                          <h4 className="font-medium">Filter Transaksi</h4>

                          <div className="space-y-2">
                            <Label htmlFor="status-filter">Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                              <SelectTrigger id="status-filter">
                                <SelectValue placeholder="Pilih status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="success">Sukses</SelectItem>
                                <SelectItem value="settlement">Settlement</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="failed">Gagal</SelectItem>
                                <SelectItem value="expire">Kadaluarsa</SelectItem>
                                <SelectItem value="cancel">Dibatalkan</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="payment-method-filter">Metode Pembayaran</Label>
                            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                              <SelectTrigger id="payment-method-filter">
                                <SelectValue placeholder="Pilih metode pembayaran" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Semua Metode</SelectItem>
                                {getUniquePaymentMethods().map((method) => (
                                  <SelectItem key={method} value={method}>
                                    {formatPaymentMethod(method)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="date-range-filter">Rentang Waktu</Label>
                            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                              <SelectTrigger id="date-range-filter">
                                <SelectValue placeholder="Pilih rentang waktu" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Semua Waktu</SelectItem>
                                <SelectItem value="today">Hari Ini</SelectItem>
                                <SelectItem value="yesterday">Kemarin</SelectItem>
                                <SelectItem value="last7days">7 Hari Terakhir</SelectItem>
                                <SelectItem value="last30days">30 Hari Terakhir</SelectItem>
                                <SelectItem value="thisMonth">Bulan Ini</SelectItem>
                                <SelectItem value="lastMonth">Bulan Lalu</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex justify-between pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearchQuery("")
                                setStatusFilter("all")
                                setPaymentMethodFilter("all")
                                setDateRangeFilter("all")
                              }}
                            >
                              Reset Filter
                            </Button>
                            <Button size="sm">Terapkan Filter</Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                      <SelectTrigger className="w-[180px]">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Rentang Waktu" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Waktu</SelectItem>
                        <SelectItem value="today">Hari Ini</SelectItem>
                        <SelectItem value="yesterday">Kemarin</SelectItem>
                        <SelectItem value="last7days">7 Hari Terakhir</SelectItem>
                        <SelectItem value="last30days">30 Hari Terakhir</SelectItem>
                        <SelectItem value="thisMonth">Bulan Ini</SelectItem>
                        <SelectItem value="lastMonth">Bulan Lalu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Filter Badges */}
                {(searchQuery ||
                  statusFilter !== "all" ||
                  paymentMethodFilter !== "all" ||
                  dateRangeFilter !== "all") && (
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <div className="bg-gray-100 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <span>Pencarian: {searchQuery}</span>
                        <button onClick={() => setSearchQuery("")} className="ml-1 text-gray-500 hover:text-gray-700">
                          ×
                        </button>
                      </div>
                    )}

                    {statusFilter !== "all" && (
                      <div className="bg-gray-100 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <span>Status: {statusFilter}</span>
                        <button
                          onClick={() => setStatusFilter("all")}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {paymentMethodFilter !== "all" && (
                      <div className="bg-gray-100 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <span>Metode: {formatPaymentMethod(paymentMethodFilter)}</span>
                        <button
                          onClick={() => setPaymentMethodFilter("all")}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {dateRangeFilter !== "all" && (
                      <div className="bg-gray-100 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <span>
                          Waktu:{" "}
                          {dateRangeFilter === "today"
                            ? "Hari Ini"
                            : dateRangeFilter === "yesterday"
                              ? "Kemarin"
                              : dateRangeFilter === "last7days"
                                ? "7 Hari Terakhir"
                                : dateRangeFilter === "last30days"
                                  ? "30 Hari Terakhir"
                                  : dateRangeFilter === "thisMonth"
                                    ? "Bulan Ini"
                                    : dateRangeFilter === "lastMonth"
                                      ? "Bulan Lalu"
                                      : ""}
                        </span>
                        <button
                          onClick={() => setDateRangeFilter("all")}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setSearchQuery("")
                        setStatusFilter("all")
                        setPaymentMethodFilter("all")
                        setDateRangeFilter("all")
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Hapus semua filter
                    </button>
                  </div>
                )}
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
                    ) : filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          <div className="flex justify-center">
                            <CreditCard className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="mt-2">
                            {transactions.length === 0
                              ? "Belum ada transaksi premium"
                              : "Tidak ada transaksi yang sesuai dengan filter"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
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

              {/* Pagination Placeholder - Bisa diimplementasikan nanti */}
              {filteredTransactions.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Sebelumnya
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Berikutnya
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
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
              {selectedTransaction.payment_details ? (
                <>
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Detail Pembayaran</h3>
                    <div className="bg-gray-50 rounded-md p-4 overflow-x-auto">
                      {!selectedTransaction.payment_details ||
                      Object.keys(selectedTransaction.payment_details).length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          <p>Detail pembayaran tidak tersedia.</p>
                          <p className="text-sm mt-2">Kemungkinan penyebab:</p>
                          <ul className="text-sm list-disc list-inside mt-1">
                            <li>Callback dari payment gateway belum diterima</li>
                            <li>Terjadi error saat menyimpan detail pembayaran</li>
                            <li>Format data tidak sesuai</li>
                          </ul>
                          <div className="mt-4">
                            <details className="text-left">
                              <summary className="cursor-pointer text-blue-500 hover:text-blue-700">Debug Info</summary>
                              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                {JSON.stringify(
                                  {
                                    transaction_id: selectedTransaction.id,
                                    payment_details: selectedTransaction.payment_details,
                                    payment_details_type: typeof selectedTransaction.payment_details,
                                    is_null: selectedTransaction.payment_details === null,
                                    is_undefined: selectedTransaction.payment_details === undefined,
                                  },
                                  null,
                                  2,
                                )}
                              </pre>
                            </details>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Payment Type */}
                          {selectedTransaction.payment_details.payment_type && (
                            <div>
                              <p className="text-sm font-medium text-gray-500">Tipe Pembayaran</p>
                              <p>{selectedTransaction.payment_details.payment_type}</p>
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
                      )}

                      {/* Virtual Account Numbers */}
                      {selectedTransaction.payment_details?.va_numbers &&
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
                      {selectedTransaction.payment_details?.permata_va_number && (
                        <div className="mt-4 border-t pt-3">
                          <h4 className="text-xs font-medium text-muted-foreground mb-2">Permata Virtual Account</h4>
                          <span className="text-sm font-mono">
                            {selectedTransaction.payment_details.permata_va_number}
                          </span>
                        </div>
                      )}

                      {/* Bill Payment */}
                      {selectedTransaction.payment_details?.bill_key &&
                        selectedTransaction.payment_details?.biller_code && (
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
                      {selectedTransaction.payment_details?.payment_code && (
                        <div className="mt-4 border-t pt-3">
                          <h4 className="text-xs font-medium text-muted-foreground mb-2">Kode Pembayaran</h4>
                          <span className="text-sm font-mono">{selectedTransaction.payment_details.payment_code}</span>
                        </div>
                      )}

                      {/* QR String */}
                      {selectedTransaction.payment_details?.qr_string && (
                        <div className="mt-4 border-t pt-3">
                          <h4 className="text-xs font-medium text-muted-foreground mb-2">QRIS Data</h4>
                          <div className="max-w-full overflow-hidden">
                            <p className="text-xs font-mono truncate">
                              {selectedTransaction.payment_details.qr_string}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Add a debug section */}
                      <div className="col-span-1 md:col-span-2 mt-4">
                        <details>
                          <summary className="cursor-pointer text-blue-500 hover:text-blue-700 text-sm">
                            Lihat Data Mentah
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                            {JSON.stringify(selectedTransaction.payment_details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Detail Pembayaran</h3>
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="text-center py-4">
                      <div className="text-amber-600 mb-2">
                        <AlertCircle className="h-8 w-8 mx-auto" />
                      </div>
                      <p className="text-muted-foreground">Data detail pembayaran tidak tersedia</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ini mungkin terjadi karena transaksi belum diproses oleh payment gateway atau data tidak
                        tersimpan dengan benar
                      </p>
                    </div>
                  </div>
                </div>
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
