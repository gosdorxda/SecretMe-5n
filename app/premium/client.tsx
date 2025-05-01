"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { LoadingDots } from "@/components/loading-dots"
import { createTransaction, getLatestTransaction, getTransactionHistory, cancelTransaction } from "./actions"
import {
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  X,
  History,
  Wallet,
  Building,
  QrCode,
  Lock,
  Store,
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Transaction = {
  id: string
  orderId: string
  status: string
  amount: number
  paymentMethod: string
  createdAt: string
  updatedAt: string
  gateway: string
}

// Tambahkan activeGateway ke props
type PremiumClientProps = {
  isLoggedIn: boolean
  isPremium: boolean
  userName: string
  premiumPrice: number
  urlStatus?: string
  urlOrderId?: string
  transaction?: Transaction | null
  activeGateway: string // Tambahkan prop ini
}

// Definisi metode pembayaran untuk Duitku
const duitkuPaymentMethods = [
  {
    id: "bank",
    name: "Transfer Bank",
    methods: [
      { id: "A1", name: "ATM Bersama", icon: "/payment-icons/atm-bersama.png" },
      { id: "NC", name: "NEO", icon: "/payment-icons/neo.png" },
      { id: "I1", name: "BNI", icon: "/payment-icons/bni.png" },
      { id: "BR", name: "BRIVA", icon: "/payment-icons/bri.png" },
      { id: "BV", name: "BSI", icon: "/payment-icons/bsi.png" },
      { id: "M2", name: "MANDIRI", icon: "/payment-icons/mandiri.png" },
      { id: "BT", name: "PERMATA", icon: "/payment-icons/permata.png" },
    ],
  },
  {
    id: "ewallet",
    name: "E-Wallet",
    methods: [
      { id: "OV", name: "OVO", icon: "/payment-icons/ovo.png" },
      { id: "SA", name: "ShopeePay", icon: "/payment-icons/shopeepay.png" },
      { id: "LF", name: "LinkAja", icon: "/payment-icons/linkaja.png" },
      { id: "DA", name: "DANA", icon: "/payment-icons/dana.png" },
    ],
  },
  {
    id: "qris",
    name: "QRIS",
    methods: [{ id: "QR", name: "QRIS", icon: "/payment-icons/qris.png" }],
  },
]

// Definisi metode pembayaran untuk TriPay berdasarkan dokumentasi resmi
const tripayPaymentMethods = [
  {
    id: "bank",
    name: "Transfer Bank",
    methods: [
      { id: "BR", name: "BRI Virtual Account", icon: "/payment-icons/bri.png" },
      { id: "M2", name: "Mandiri Virtual Account", icon: "/payment-icons/mandiri.png" },
      { id: "I1", name: "BNI Virtual Account", icon: "/payment-icons/bni.png" },
      { id: "BV", name: "BSI Virtual Account", icon: "/payment-icons/bsi.png" },
      { id: "BT", name: "Permata Virtual Account", icon: "/payment-icons/permata.png" },
      { id: "NC", name: "CIMB Virtual Account", icon: "/payment-icons/cimb.png" },
    ],
  },
  {
    id: "ewallet",
    name: "E-Wallet",
    methods: [
      { id: "OV", name: "OVO", icon: "/payment-icons/ovo.png" },
      { id: "SA", name: "ShopeePay", icon: "/payment-icons/shopeepay.png" },
      { id: "LF", name: "LinkAja", icon: "/payment-icons/linkaja.png" },
      { id: "DA", name: "DANA", icon: "/payment-icons/dana.png" },
    ],
  },
  {
    id: "qris",
    name: "QRIS",
    methods: [{ id: "QR", name: "QRIS by ShopeePay", icon: "/payment-icons/qris.png" }],
  },
  {
    id: "retail",
    name: "Retail",
    methods: [
      { id: "A1", name: "Alfamart", icon: "/payment-icons/alfamart.png" },
      { id: "IR", name: "Indomaret", icon: "/payment-icons/indomaret.png" },
    ],
  },
]

// Perbarui destructuring di function component
export function PremiumClient({
  isLoggedIn,
  isPremium,
  userName,
  premiumPrice,
  urlStatus,
  urlOrderId,
  transaction,
  activeGateway, // Tambahkan prop ini
}: PremiumClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("BR")
  const [selectedPaymentTab, setSelectedPaymentTab] = useState<string>("bank")
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(transaction || null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [cancellingTransaction, setCancellingTransaction] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Pilih metode pembayaran berdasarkan gateway aktif
  const getPaymentMethodsForGateway = () => {
    switch (activeGateway) {
      case "tripay":
        return tripayPaymentMethods
      case "duitku":
      default:
        return duitkuPaymentMethods
    }
  }

  // Gunakan metode pembayaran yang sesuai dengan gateway aktif
  const currentPaymentMethods = getPaymentMethodsForGateway()

  // Efek untuk memeriksa status transaksi secara berkala jika ada transaksi pending
  useEffect(() => {
    if (!currentTransaction || currentTransaction.status !== "pending") return

    const checkStatus = async () => {
      try {
        setCheckingStatus(true)
        const result = await getLatestTransaction()
        setCheckingStatus(false)

        if (result.success) {
          if (result.isPremium) {
            toast({
              title: "Pembayaran Berhasil!",
              description: "Akun Anda telah diupgrade ke Premium.",
              variant: "default",
            })
            // Refresh halaman untuk menampilkan status premium
            router.refresh()
          } else if (result.hasTransaction) {
            setCurrentTransaction(result.transaction)

            // Jika status berubah menjadi success, refresh halaman
            if (result.transaction.status === "success" && currentTransaction.status !== "success") {
              toast({
                title: "Pembayaran Berhasil!",
                description: "Akun Anda telah diupgrade ke Premium.",
                variant: "default",
              })
              router.refresh()
            }

            // Jika status berubah menjadi failed, tampilkan pesan error
            if (result.transaction.status === "failed" && currentTransaction.status !== "failed") {
              toast({
                title: "Pembayaran Gagal",
                description: "Silakan coba lagi atau gunakan metode pembayaran lain.",
                variant: "destructive",
              })
            }
          }
        }
      } catch (error) {
        console.error("Error checking transaction status:", error)
        setCheckingStatus(false)
      }
    }

    // Periksa status setiap 10 detik
    const interval = setInterval(checkStatus, 10000)

    // Periksa status segera saat komponen dimuat
    checkStatus()

    return () => clearInterval(interval)
  }, [currentTransaction, router, toast])

  // Efek untuk menampilkan toast berdasarkan status URL
  useEffect(() => {
    if (urlStatus === "success" && urlOrderId) {
      toast({
        title: "Pembayaran Berhasil!",
        description: "Akun Anda telah diupgrade ke Premium.",
        variant: "default",
      })
    } else if (urlStatus === "failed" && urlOrderId) {
      toast({
        title: "Pembayaran Gagal",
        description: "Silakan coba lagi atau gunakan metode pembayaran lain.",
        variant: "destructive",
      })
    } else if (urlStatus === "pending" && urlOrderId) {
      toast({
        title: "Pembayaran Tertunda",
        description: "Kami sedang menunggu konfirmasi pembayaran Anda.",
      })
    }
  }, [urlStatus, urlOrderId, toast])

  // Fungsi untuk menangani perubahan tab metode pembayaran
  const handlePaymentTabChange = (value: string) => {
    setSelectedPaymentTab(value)
    // Set default payment method for the selected tab
    const category = currentPaymentMethods.find((cat) => cat.id === value)
    if (category && category.methods.length > 0) {
      setSelectedPaymentMethod(category.methods[0].id)
    }
  }

  // Perbarui fungsi handlePayment untuk mengirim activeGateway
  const handlePayment = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Panggil server action untuk membuat transaksi
      // Tambahkan activeGateway sebagai parameter kedua
      const result = await createTransaction(selectedPaymentMethod, activeGateway)

      if (!result.success) {
        setError(result.error || "Terjadi kesalahan saat memproses pembayaran")
        setIsLoading(false)
        return
      }

      // Redirect ke URL pembayaran dari gateway
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl
      } else {
        setError("Tidak mendapatkan URL pembayaran dari gateway")
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error("Error processing payment:", error)
      setError(error.message || "Terjadi kesalahan saat memproses pembayaran")
      setIsLoading(false)
    }
  }

  // Fungsi untuk memeriksa status transaksi secara manual
  const checkTransactionStatus = async () => {
    if (!currentTransaction) return

    try {
      setCheckingStatus(true)
      const result = await getLatestTransaction()
      setCheckingStatus(false)

      if (result.success) {
        if (result.isPremium) {
          toast({
            title: "Pembayaran Berhasil!",
            description: "Akun Anda telah diupgrade ke Premium.",
            variant: "default",
          })
          router.refresh()
        } else if (result.hasTransaction) {
          setCurrentTransaction(result.transaction)

          if (result.transaction.status === "success") {
            toast({
              title: "Pembayaran Berhasil!",
              description: "Akun Anda telah diupgrade ke Premium.",
              variant: "default",
            })
            router.refresh()
          } else if (result.transaction.status === "failed") {
            toast({
              title: "Pembayaran Gagal",
              description: "Silakan coba lagi atau gunakan metode pembayaran lain.",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Status Pembayaran",
              description: `Status pembayaran Anda: ${result.transaction.status}`,
            })
          }
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal memeriksa status transaksi",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error checking transaction status:", error)
      setCheckingStatus(false)
      toast({
        title: "Error",
        description: error.message || "Gagal memeriksa status transaksi",
        variant: "destructive",
      })
    }
  }

  // Fungsi untuk membatalkan transaksi
  const handleCancelTransaction = async () => {
    if (!currentTransaction) return

    try {
      setCancellingTransaction(true)
      const result = await cancelTransaction(currentTransaction.id)
      setCancellingTransaction(false)

      if (result.success) {
        toast({
          title: "Transaksi Dibatalkan",
          description: "Transaksi Anda telah berhasil dibatalkan.",
          variant: "default",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal membatalkan transaksi",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error cancelling transaction:", error)
      setCancellingTransaction(false)
      toast({
        title: "Error",
        description: error.message || "Gagal membatalkan transaksi",
        variant: "destructive",
      })
    }
  }

  // Fungsi untuk memuat riwayat transaksi
  const loadTransactionHistory = async () => {
    try {
      setLoadingHistory(true)
      const result = await getTransactionHistory()
      setLoadingHistory(false)

      if (result.success) {
        setTransactions(result.transactions)
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal memuat riwayat transaksi",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error loading transaction history:", error)
      setLoadingHistory(false)
      toast({
        title: "Error",
        description: error.message || "Gagal memuat riwayat transaksi",
        variant: "destructive",
      })
    }
  }

  // Fungsi untuk memformat tanggal
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Fungsi untuk mendapatkan warna badge berdasarkan status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500"
      case "failed":
      case "cancelled":
        return "bg-red-500"
      case "pending":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  // Fungsi untuk mendapatkan label status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "success":
        return "Berhasil"
      case "failed":
        return "Gagal"
      case "pending":
        return "Tertunda"
      case "cancelled":
        return "Dibatalkan"
      default:
        return status
    }
  }

  // Render status transaksi
  const renderTransactionStatus = () => {
    if (!currentTransaction) return null

    let statusIcon
    let statusTitle
    let statusColor

    switch (currentTransaction.status) {
      case "success":
        statusIcon = <CheckCircle className="h-5 w-5 text-green-500" />
        statusTitle = "Pembayaran Berhasil"
        statusColor = "border-green-200 bg-green-50"
        break
      case "failed":
        statusIcon = <AlertCircle className="h-5 w-5 text-red-500" />
        statusTitle = "Pembayaran Gagal"
        statusColor = "border-red-200 bg-red-50"
        break
      case "cancelled":
        statusIcon = <X className="h-5 w-5 text-red-500" />
        statusTitle = "Pembayaran Dibatalkan"
        statusColor = "border-red-200 bg-red-50"
        break
      case "pending":
      default:
        statusIcon = <Clock className="h-5 w-5 text-yellow-500" />
        statusTitle = "Pembayaran Tertunda"
        statusColor = "border-yellow-200 bg-yellow-50"
    }

    return (
      <div className={`mb-4 flex justify-between items-center p-3 rounded-lg ${statusColor}`}>
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className="font-medium">{statusTitle}</span>
        </div>
        <div className="flex gap-2">
          {currentTransaction.status === "pending" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={checkTransactionStatus}
                disabled={checkingStatus}
                className="h-8 px-2"
              >
                {checkingStatus ? <LoadingDots /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelTransaction}
                disabled={cancellingTransaction}
                className="h-8 px-2"
              >
                {cancellingTransaction ? <LoadingDots /> : <X className="h-4 w-4" />}
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  // Render riwayat transaksi
  const renderTransactionHistory = () => {
    return (
      <Accordion type="single" collapsible className="mb-6">
        <AccordionItem value="history">
          <AccordionTrigger className="flex items-center">
            <div className="flex items-center">
              <History className="mr-2 h-4 w-4" />
              Riwayat Transaksi
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {loadingHistory ? (
              <div className="flex justify-center py-4">
                <LoadingDots />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">Tidak ada riwayat transaksi</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Metode</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(tx.createdAt)}</TableCell>
                        <TableCell className="font-mono text-xs">{tx.orderId}</TableCell>
                        <TableCell>Rp {tx.amount.toLocaleString("id-ID")}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(tx.status)}>{getStatusLabel(tx.status)}</Badge>
                        </TableCell>
                        <TableCell>{tx.paymentMethod || tx.gateway || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {!loadingHistory && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" size="sm" onClick={loadTransactionHistory}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Muat Ulang
                </Button>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    )
  }

  // Render metode pembayaran
  const renderPaymentMethods = () => {
    // Buat array tab berdasarkan metode pembayaran yang tersedia
    const tabs = currentPaymentMethods.map((category) => ({
      id: category.id,
      name: category.name,
      icon:
        category.id === "bank"
          ? Building
          : category.id === "ewallet"
            ? Wallet
            : category.id === "qris"
              ? QrCode
              : category.id === "retail"
                ? Store
                : Building,
    }))

    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <Lock className="h-5 w-5 text-green-500 mr-2" />
          Pilih Metode Pembayaran
          {activeGateway === "tripay" && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">TriPay</span>
          )}
        </h3>
        <Tabs value={selectedPaymentTab} onValueChange={handlePaymentTabChange} className="w-full">
          <TabsList className={`grid w-full grid-cols-${tabs.length} mb-4`}>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {currentPaymentMethods.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-0">
              <RadioGroup
                value={selectedPaymentMethod}
                onValueChange={setSelectedPaymentMethod}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
              >
                {category.methods.map((method) => (
                  <div key={method.id} className="relative">
                    <RadioGroupItem value={method.id} id={method.id} className="peer sr-only" />
                    <Label
                      htmlFor={method.id}
                      className="flex items-center gap-3 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <div className="w-8 h-8 flex items-center justify-center">
                        <img
                          src={method.icon || "/placeholder.svg?height=32&width=32&query=bank"}
                          alt={method.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <span>{method.name}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    )
  }

  // Jika user sudah premium, tampilkan pesan sukses
  if (isPremium) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="mb-8 border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <CardTitle className="text-2xl">Akun Premium</CardTitle>
              </div>
              <CardDescription>Selamat! Anda telah berhasil mengupgrade ke akun Premium.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-green-50 p-3 rounded-full border border-green-200">
                  <Lock className="h-12 w-12 text-green-500" />
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Premium Aktif</h3>
                <p className="text-muted-foreground">
                  Terima kasih telah menjadi pengguna premium. Nikmati semua fitur eksklusif SecretMe tanpa batasan.
                </p>
              </div>

              {/* Riwayat Transaksi untuk pengguna premium */}
              {renderTransactionHistory()}
            </CardContent>
            <CardFooter className="border-t bg-gradient-to-r from-green-50 to-green-100">
              <Button onClick={() => router.push("/dashboard")} className="w-full">
                Kembali ke Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Check if transaction is null before using it
  if (!transaction) {
    // If no transaction exists, just render the premium upgrade UI without transaction status
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="mb-8 border-2 shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Upgrade ke Premium</CardTitle>
                  <CardDescription>Akses seumur hidup, bayar sekali</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">Rp {premiumPrice.toLocaleString("id-ID")}</div>
                  <div className="text-xs text-muted-foreground">Harga sudah termasuk pajak</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Riwayat Transaksi */}
              {renderTransactionHistory()}

              {/* Metode Pembayaran */}
              {renderPaymentMethods()}

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                <Lock className="h-4 w-4 text-green-500" />
                <span>Pembayaran aman & terenkripsi</span>
              </div>

              {error && <div className="text-red-500 text-sm mt-2 text-center">{error}</div>}
            </CardContent>
            <CardFooter className="border-t">
              <Button onClick={handlePayment} disabled={isLoading} className="w-full">
                {isLoading ? <LoadingDots /> : "Lanjutkan ke Pembayaran"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Format transaksi untuk client
  const formattedTransaction = {
    id: transaction.id,
    orderId: transaction.plan_id,
    status: transaction.status,
    amount: transaction.amount,
    paymentMethod: transaction.payment_method || "",
    createdAt: transaction.created_at,
    updatedAt: transaction.updated_at,
    gateway: transaction.payment_gateway,
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-8 border-2 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Upgrade ke Premium</CardTitle>
                <CardDescription>Akses seumur hidup, bayar sekali</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">Rp {premiumPrice.toLocaleString("id-ID")}</div>
                <div className="text-xs text-muted-foreground">Harga sudah termasuk pajak</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Tampilkan status transaksi jika ada */}
            {renderTransactionStatus()}

            {/* Riwayat Transaksi */}
            {renderTransactionHistory()}

            {/* Hanya tampilkan form pembayaran jika tidak ada transaksi pending */}
            {transaction &&
            (currentTransaction.status === "pending" || currentTransaction.status === "success") ? null : (
              <>
                {/* Metode Pembayaran */}
                {renderPaymentMethods()}

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                  <Lock className="h-4 w-4 text-green-500" />
                  <span>Pembayaran aman & terenkripsi</span>
                </div>
              </>
            )}

            {error && <div className="text-red-500 text-sm mt-2 text-center">{error}</div>}
          </CardContent>
          <CardFooter className="border-t">
            {transaction && (currentTransaction.status === "pending" || currentTransaction.status === "success") ? (
              <Button onClick={() => router.push("/")} className="w-full">
                Kembali ke Beranda
              </Button>
            ) : (
              <Button onClick={handlePayment} disabled={isLoading} className="w-full">
                {isLoading ? <LoadingDots /> : "Lanjutkan ke Pembayaran"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
