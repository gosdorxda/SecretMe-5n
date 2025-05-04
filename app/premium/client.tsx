"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { createTransaction, getLatestTransaction, getTransactionHistory, cancelTransaction } from "./actions"
import {
  CheckCircle,
  Clock,
  RefreshCw,
  X,
  History,
  Wallet,
  Building,
  QrCode,
  ExternalLink,
  Copy,
  Info,
  Star,
  Shield,
  Zap,
  Clock3,
  CreditCard,
  ChevronRight,
  Award,
  Sparkles,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

type Transaction = {
  id: string
  orderId: string
  status: string
  amount: number
  paymentMethod: string
  createdAt: string
  updatedAt: string
  gateway: string
  paymentDetails?: any
}

type PremiumClientProps = {
  isLoggedIn: boolean
  isPremium: boolean
  userName: string
  premiumPrice: number
  urlStatus?: string
  urlOrderId?: string
  transaction?: Transaction | null
  activeGateway: string
}

// Definisi metode pembayaran untuk Duitku
const duitkuPaymentMethods = [
  {
    id: "qris",
    name: "QRIS",
    methods: [
      {
        id: "QR",
        name: "QRIS by ShopeePay",
        icon: "/payment-icons/qris.png",
        recommended: true,
        description: "Bayar dengan aplikasi e-wallet favorit Anda",
        features: ["Proses instan", "Tersedia 24/7", "Tanpa biaya tambahan"],
      },
    ],
  },
  {
    id: "bank",
    name: "Transfer Bank",
    methods: [
      {
        id: "BC",
        name: "BCA Virtual Account",
        icon: "/payment-icons/bca.png",
        description: "Transfer melalui ATM, m-Banking, atau internet banking",
        features: ["Verifikasi otomatis", "Aman & terpercaya"],
      },
    ],
  },
  {
    id: "ewallet",
    name: "E-Wallet",
    methods: [
      {
        id: "OV",
        name: "OVO",
        icon: "/payment-icons/ovo.png",
        description: "Bayar langsung dari saldo OVO Anda",
        features: ["Proses instan", "Tanpa biaya tambahan"],
      },
      {
        id: "DA",
        name: "DANA",
        icon: "/payment-icons/dana.png",
        description: "Bayar langsung dari saldo DANA Anda",
        features: ["Proses instan", "Tanpa biaya tambahan"],
      },
    ],
  },
]

// Definisi metode pembayaran untuk TriPay
const tripayPaymentMethods = [
  {
    id: "qris",
    name: "QRIS",
    methods: [
      {
        id: "QR",
        name: "QRIS by ShopeePay",
        icon: "https://qieadczmickhkzyywdwg.supabase.co/storage/v1/object/public/logo.channel.payment//QRIS_ID_CHNL_LOGO.webp",
        recommended: true,
        description: "Bayar dengan aplikasi e-wallet favorit Anda",
        features: ["Proses instan", "Tersedia 24/7", "Tanpa biaya tambahan"],
      },
    ],
  },
  {
    id: "bank",
    name: "Transfer Bank",
    methods: [
      {
        id: "BC",
        name: "BCA Virtual Account",
        icon: "https://qieadczmickhkzyywdwg.supabase.co/storage/v1/object/public/logo.channel.payment//BCA.webp",
        description: "Transfer melalui ATM, m-Banking, atau internet banking",
        features: ["Verifikasi otomatis", "Aman & terpercaya"],
      },
    ],
  },
]

// Fungsi untuk menampilkan instruksi pembayaran berdasarkan metode pembayaran
const renderPaymentInstructions = (paymentMethod: string, paymentDetails: any) => {
  if (!paymentMethod || !paymentDetails) return null

  switch (paymentMethod) {
    case "BC": // BCA Virtual Account
      return (
        <div className="bg-white p-4 rounded-md border-2 border-gray-100 shadow-sm">
          <div className="text-sm font-semibold mb-2 flex items-center">
            <Building className="h-4 w-4 mr-2 text-blue-600" />
            Instruksi Pembayaran BCA Virtual Account:
          </div>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Masukkan kartu ATM dan PIN Anda.</li>
            <li>
              Pilih menu <span className="font-medium">"Transfer"</span>.
            </li>
            <li>Masukkan nomor virtual account BCA.</li>
            <li>Masukkan jumlah yang akan dibayarkan.</li>
            <li>Ikuti instruksi selanjutnya untuk menyelesaikan pembayaran.</li>
          </ol>
          <div className="mt-3 text-xs text-gray-500 bg-blue-50 p-2 rounded-md flex items-start">
            <Info className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0 text-blue-500" />
            <span>
              Pembayaran akan diverifikasi secara otomatis oleh sistem dalam waktu 5-10 menit setelah pembayaran
              berhasil.
            </span>
          </div>
        </div>
      )
    case "QR": // QRIS
      return (
        <div className="bg-white p-4 rounded-md border-2 border-gray-100 shadow-sm">
          <div className="text-sm font-semibold mb-2 flex items-center">
            <QrCode className="h-4 w-4 mr-2 text-green-600" />
            Instruksi Pembayaran QRIS:
          </div>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Buka aplikasi pembayaran yang mendukung QRIS (GoPay, OVO, DANA, LinkAja, atau mobile banking).</li>
            <li>
              Pilih menu <span className="font-medium">"Bayar"</span> atau <span className="font-medium">"Scan"</span>.
            </li>
            <li>Scan kode QR yang tersedia.</li>
            <li>Masukkan jumlah yang akan dibayarkan.</li>
            <li>Konfirmasi pembayaran dan masukkan PIN jika diperlukan.</li>
          </ol>
          <div className="mt-3 text-xs text-gray-500 bg-green-50 p-2 rounded-md flex items-start">
            <Zap className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0 text-green-500" />
            <span>Pembayaran akan diverifikasi secara instan setelah pembayaran berhasil.</span>
          </div>
        </div>
      )
    default:
      return (
        <div className="bg-white p-4 rounded-md border-2 border-gray-100 shadow-sm">
          <div className="text-sm font-semibold mb-2 flex items-center">
            <Info className="h-4 w-4 mr-2 text-gray-600" />
            Instruksi Pembayaran:
          </div>
          <p className="text-sm">Tidak ada instruksi pembayaran yang tersedia untuk metode ini.</p>
        </div>
      )
  }
}

export function PremiumClient({
  isLoggedIn,
  isPremium,
  userName,
  premiumPrice,
  urlStatus,
  urlOrderId,
  transaction,
  activeGateway,
}: PremiumClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("QR")
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [cancellingTransaction, setCancellingTransaction] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const initializedRef = useRef(false)

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

  // Format transaksi untuk client
  useEffect(() => {
    if (transaction && !initializedRef.current) {
      const formattedTransaction = {
        id: transaction.id,
        orderId: transaction.plan_id,
        status: transaction.status,
        amount: transaction.amount,
        paymentMethod: transaction.payment_method || "",
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
        gateway: transaction.payment_gateway,
        paymentDetails: transaction.payment_details || {},
      }
      setCurrentTransaction(formattedTransaction)
      initializedRef.current = true
    }
  }, [transaction])

  // Efek untuk memeriksa status transaksi secara berkala jika ada transaksi pending
  useEffect(() => {
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
            // Hanya update jika status berbeda untuk menghindari loop
            if (
              !currentTransaction ||
              currentTransaction.status !== result.transaction.status ||
              currentTransaction.id !== result.transaction.id
            ) {
              setCurrentTransaction(result.transaction)
            }

            // Jika status berubah menjadi success, refresh halaman
            if (result.transaction.status === "success" && currentTransaction?.status !== "success") {
              toast({
                title: "Pembayaran Berhasil!",
                description: "Akun Anda telah diupgrade ke Premium.",
                variant: "default",
              })
              router.refresh()
            }

            // Jika status berubah menjadi failed, tampilkan pesan error
            if (result.transaction.status === "failed" && currentTransaction?.status !== "failed") {
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

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Set up interval only if there's a pending transaction
    if (currentTransaction?.status === "pending") {
      // Initial check
      checkStatus()
      // Set up interval for subsequent checks
      intervalRef.current = setInterval(checkStatus, 10000)
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
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

  // Perbarui fungsi handlePayment untuk mengirim activeGateway
  const handlePayment = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Panggil server action untuk membuat transaksi
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
          // Hanya update jika status berbeda untuk menghindari loop
          if (
            !currentTransaction ||
            currentTransaction.status !== result.transaction.status ||
            currentTransaction.id !== result.transaction.id
          ) {
            setCurrentTransaction(result.transaction)
          }

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

  // Fungsi untuk menyalin teks ke clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedText(label)
        toast({
          title: "Berhasil disalin!",
          description: `${label} telah disalin ke clipboard.`,
          variant: "default",
        })
        setTimeout(() => setCopiedText(null), 3000)
      },
      (err) => {
        console.error("Gagal menyalin teks: ", err)
        toast({
          title: "Gagal menyalin",
          description: "Tidak dapat menyalin teks ke clipboard.",
          variant: "destructive",
        })
      },
    )
  }

  // Render detail transaksi pending
  const renderPendingTransactionDetails = () => {
    if (!currentTransaction || currentTransaction.status !== "pending") return null

    // Ekstrak detail pembayaran dari payment_details
    const paymentDetails = currentTransaction.paymentDetails || {}
    const paymentUrl =
      paymentDetails.checkout_url ||
      paymentDetails.pay_url ||
      paymentDetails.payment_url ||
      paymentDetails.redirect_url ||
      ""
    const vaNumber = paymentDetails.pay_code || paymentDetails.va_number || ""
    const expiredTime = paymentDetails.expired_time || paymentDetails.expired_at || ""
    const qrCodeUrl = paymentDetails.qr_string || paymentDetails.qr_url || ""
    const customerName = paymentDetails.customer_name || userName || ""
    const customerEmail = paymentDetails.customer_email || ""
    const amount = currentTransaction.amount || premiumPrice
    const paymentMethod = currentTransaction.paymentMethod || ""

    return (
      <div className="mt-6 space-y-4">
        <div className="bg-yellow-50 border-2 border-yellow-100 rounded-md p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-yellow-100 p-2 rounded-md">
              <Clock3 className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-800">Menunggu Pembayaran</h3>
              <p className="text-sm text-yellow-700">Selesaikan pembayaran sebelum batas waktu berakhir</p>
            </div>
          </div>

          {/* Detail Pembayaran */}
          <div className="bg-white p-4 rounded-md border-2 border-gray-100 mb-4">
            <h4 className="font-medium mb-3 pb-2 border-b">Detail Pembayaran</h4>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Metode Pembayaran:</span>
                <span className="font-medium">{paymentMethod}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Jumlah:</span>
                <span className="font-medium">Rp {amount.toLocaleString("id-ID")}</span>
              </div>

              {customerName && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Nama:</span>
                  <span className="font-medium">{customerName}</span>
                </div>
              )}

              {customerEmail && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Email:</span>
                  <span className="font-medium">{customerEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Waktu Kadaluarsa */}
          {expiredTime && (
            <div className="bg-white p-4 rounded-md border-2 border-yellow-100 mb-4">
              <div className="text-sm text-gray-500 mb-1">Batas Waktu Pembayaran:</div>
              <div className="font-medium text-lg">{formatDate(expiredTime)}</div>
            </div>
          )}

          {/* QR Code untuk QRIS */}
          {qrCodeUrl && paymentMethod === "QR" && (
            <div className="bg-white p-4 rounded-md border-2 border-gray-100 mb-4 text-center">
              <div className="text-sm text-gray-500 mb-3">Scan QR Code untuk membayar:</div>
              <div className="flex justify-center mb-2">
                <img src={qrCodeUrl || "/placeholder.svg"} alt="QRIS QR Code" className="max-w-[200px] h-auto" />
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Gunakan aplikasi e-wallet atau mobile banking yang mendukung QRIS
              </div>
            </div>
          )}

          {/* Nomor Virtual Account atau Kode Pembayaran */}
          {vaNumber && (
            <div className="bg-white p-4 rounded-md border-2 border-gray-100 mb-4">
              <div className="text-sm text-gray-500 mb-1">Nomor Virtual Account / Kode Pembayaran:</div>
              <div className="flex items-center justify-between">
                <div className="font-mono text-xl font-bold">{vaNumber}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(vaNumber, "Nomor pembayaran")}
                  className="h-8"
                >
                  <Copy className={`h-4 w-4 mr-1 ${copiedText === "Nomor pembayaran" ? "text-green-500" : ""}`} />
                  Salin
                </Button>
              </div>
            </div>
          )}

          {/* Instruksi Pembayaran */}
          <div className="bg-white p-4 rounded-md border-2 border-gray-100 mb-4">
            <div className="text-sm font-semibold mb-3 flex items-center">
              <Info className="h-4 w-4 mr-2 text-blue-500" />
              <span>Instruksi Pembayaran</span>
            </div>

            {paymentDetails.instructions && paymentDetails.instructions.length > 0 ? (
              <div className="space-y-4">
                {paymentDetails.instructions.map((instruction: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium">{instruction.title || `Metode ${index + 1}`}</h4>
                    <ol className="list-decimal pl-5 space-y-1">
                      {instruction.steps &&
                        instruction.steps.map((step: string, stepIndex: number) => (
                          <li key={stepIndex} className="text-sm">
                            {step}
                          </li>
                        ))}
                    </ol>
                  </div>
                ))}
              </div>
            ) : (
              renderPaymentInstructions(currentTransaction.paymentMethod, currentTransaction.paymentDetails)
            )}
          </div>

          {/* Tombol Tindakan */}
          <div className="flex flex-col gap-3 mt-6">
            <Button
              variant="success"
              onClick={() => window.open(paymentUrl, "_blank")}
              disabled={!paymentUrl}
              className="w-full py-3 h-auto"
            >
              <ExternalLink className="h-5 w-5 mr-2" /> Lanjutkan Pembayaran
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={checkTransactionStatus}
                disabled={checkingStatus}
                className="neo-btn-outline"
              >
                {checkingStatus ? (
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Periksa Status
              </Button>

              <Button variant="destructive" onClick={handleCancelTransaction} disabled={cancellingTransaction}>
                {cancellingTransaction ? (
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Batalkan
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render riwayat transaksi
  const renderTransactionHistory = () => {
    return (
      <div className="p-4">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <History className="mr-2 h-5 w-5" />
          Riwayat Transaksi
        </h3>

        {!transactions.length && !loadingHistory ? (
          <div className="text-center py-8 border-2 border-dashed rounded-md bg-gray-50">
            <History className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground">Belum ada riwayat transaksi</p>
            <p className="text-xs text-gray-400 mt-1">Riwayat transaksi Anda akan muncul di sini</p>
          </div>
        ) : loadingHistory ? (
          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-md bg-gray-50">
            <Clock className="h-10 w-10 text-gray-300 animate-pulse mb-3" />
            <p className="text-muted-foreground">Memuat riwayat transaksi...</p>
          </div>
        ) : (
          <div className="border-2 rounded-md overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[180px]">Tanggal</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Metode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{formatDate(tx.createdAt)}</TableCell>
                    <TableCell className="font-mono text-xs">{tx.orderId}</TableCell>
                    <TableCell>Rp {tx.amount.toLocaleString("id-ID")}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.status === "success" ? "success" : tx.status === "pending" ? "warning" : "destructive"
                        }
                      >
                        {getStatusLabel(tx.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{tx.paymentMethod || tx.gateway || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTransactionHistory}
            disabled={loadingHistory}
            className="neo-btn-outline"
          >
            {loadingHistory ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {loadingHistory ? "Memuat..." : "Muat Riwayat"}
          </Button>
        </div>
      </div>
    )
  }

  // Render metode pembayaran
  const renderPaymentMethods = () => {
    // Urutkan metode pembayaran: QRIS, E-Wallet, Transfer Bank
    const orderedCategories = ["qris", "ewallet", "bank"]

    // Flatten semua metode pembayaran dari semua kategori
    const allMethods = []

    // Urutkan kategori sesuai urutan yang diinginkan
    orderedCategories.forEach((categoryId) => {
      const category = currentPaymentMethods.find((cat) => cat.id === categoryId)
      if (category) {
        category.methods.forEach((method) => {
          allMethods.push({
            ...method,
            categoryName: category.name,
            categoryId: category.id,
          })
        })
      }
    })

    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <CreditCard className="h-5 w-5 text-green-500 mr-2" />
          Pilih Metode Pembayaran
          {activeGateway === "tripay" && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md">TriPay</span>
          )}
        </h3>

        <RadioGroup
          value={selectedPaymentMethod}
          onValueChange={setSelectedPaymentMethod}
          className="grid grid-cols-1 gap-4"
        >
          {allMethods.map((method) => (
            <div key={method.id} className="relative">
              <RadioGroupItem value={method.id} id={method.id} className="peer sr-only" />
              <Label
                htmlFor={method.id}
                className="flex flex-col rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-gray-50 rounded-md border-2 border-muted">
                      {method.icon ? (
                        <img
                          src={method.icon || "/placeholder.svg"}
                          alt={method.name}
                          className="max-w-full max-h-full p-1"
                        />
                      ) : method.categoryId === "bank" ? (
                        <Building className="h-6 w-6 text-gray-500" />
                      ) : method.categoryId === "ewallet" ? (
                        <Wallet className="h-6 w-6 text-gray-500" />
                      ) : (
                        <QrCode className="h-6 w-6 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-lg">{method.name}</div>
                      <div className="text-sm text-muted-foreground">{method.categoryName}</div>
                      {method.description && <div className="text-xs text-gray-500 mt-1">{method.description}</div>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">Rp {premiumPrice.toLocaleString("id-ID")}</div>
                    <div className="text-xs text-muted-foreground">Sekali bayar</div>
                  </div>
                </div>

                {/* Features */}
                {method.features && method.features.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-dashed">
                    <div className="flex flex-wrap gap-2">
                      {method.features.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md"
                        >
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Label>

              {/* Badge untuk metode yang direkomendasikan */}
              {method.recommended && (
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-3 py-1 rounded-md shadow-md flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Rekomendasi
                  </div>
                </div>
              )}
            </div>
          ))}
        </RadioGroup>
      </div>
    )
  }

  // Jika user sudah premium, tampilkan pesan sukses
  if (isPremium) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Akun Premium</h1>
            <p className="text-muted-foreground">Nikmati semua fitur premium tanpa batasan</p>
          </div>

          <Card className="mb-4 neo-card border-2 shadow-lg overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Status Premium</CardTitle>
                </div>
                <div className="text-right">
                  <Badge variant="success" className="text-base py-1 px-3">
                    Aktif
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 pb-6 relative">
              <div className="mb-8 p-4 rounded-md border-green-200 bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-md">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800">Akun Anda sudah Premium</h3>
                    <p className="text-sm text-green-700">Semua fitur premium telah diaktifkan untuk akun Anda</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center mb-8">
                <div className="bg-gradient-to-r from-gray-800 to-black p-8 rounded-md shadow-lg">
                  <Award className="h-16 w-16 text-yellow-400" />
                </div>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold mb-3">Premium Aktif</h3>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  Terima kasih telah menjadi pengguna premium. Nikmati semua fitur eksklusif SecretMe tanpa batasan.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-md border-2 text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <h4 className="font-medium">Privasi Terjamin</h4>
                  <p className="text-xs text-gray-500">Keamanan data Anda adalah prioritas kami</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md border-2 text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <h4 className="font-medium">Fitur Tanpa Batas</h4>
                  <p className="text-xs text-gray-500">Akses semua fitur premium tanpa batasan</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md border-2 text-center">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <h4 className="font-medium">Pengalaman Premium</h4>
                  <p className="text-xs text-gray-500">Nikmati pengalaman pengguna yang lebih baik</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t p-6">
              <Button
                onClick={() => router.push("/dashboard")}
                variant="default"
                className="w-full neo-btn py-3 h-auto text-base mt-3"
              >
                Kembali ke Dashboard
              </Button>
            </CardFooter>
          </Card>

          {/* Riwayat Transaksi untuk pengguna premium */}
          <Card className="mb-4 neo-card border-2 shadow-sm">{renderTransactionHistory()}</Card>
        </div>
      </div>
    )
  }

  // Check if transaction is null before using it
  if (!transaction) {
    // If no transaction exists, just render the premium upgrade UI without transaction status
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Upgrade ke Premium</h1>
            <p className="text-muted-foreground">Akses semua fitur premium dengan sekali bayar seumur hidup</p>
          </div>

          <Card className="mb-4 neo-card border-2 shadow-lg overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Pilih Metode Pembayaran</CardTitle>
                <Badge variant="outline" className="text-base py-1 px-3 bg-white">
                  {activeGateway === "tripay" ? "TriPay" : "Duitku"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-4 relative">
              <div className="mb-6 p-4 rounded-md border-2 border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-md border">
                    <Info className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Status Akun: Free</h3>
                    <p className="text-sm text-gray-600">Upgrade ke premium untuk mendapatkan fitur tambahan</p>
                  </div>
                </div>
              </div>

              {/* Metode Pembayaran */}
              {renderPaymentMethods()}

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4 bg-gray-50 p-3 rounded-md border">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Pembayaran aman & terenkripsi</span>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm mt-4 text-center">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t p-6">
              <Button
                onClick={handlePayment}
                disabled={isLoading}
                variant="success"
                className="w-full py-3 h-auto text-base flex items-center justify-center mt-3"
              >
                {isLoading ? (
                  <>
                    <Clock className="h-5 w-5 mr-2 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    Lanjutkan ke Pembayaran <ChevronRight className="h-5 w-5 ml-1" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Riwayat Transaksi di bawah card utama */}
          <Card className="mb-4 neo-card border-2 shadow-sm">{renderTransactionHistory()}</Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Upgrade ke Premium</h1>
          <p className="text-muted-foreground">Akses semua fitur premium dengan sekali bayar seumur hidup</p>
        </div>

        <Card className="mb-4 neo-card border-2 shadow-lg overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Status Pembayaran</CardTitle>
              {currentTransaction ? (
                <Badge
                  variant={
                    currentTransaction.status === "success"
                      ? "success"
                      : currentTransaction.status === "pending"
                        ? "warning"
                        : "destructive"
                  }
                  className="text-base py-1 px-3"
                >
                  {getStatusLabel(currentTransaction.status)}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-base py-1 px-3 bg-white">
                  Belum Ada Transaksi
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6 pb-4 relative">
            {/* Status akun dan pembayaran */}
            {currentTransaction && currentTransaction.status === "pending" ? (
              renderPendingTransactionDetails()
            ) : (
              <>
                <div className="mb-6 p-4 rounded-md border-2 border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-md border">
                      <Info className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Status Akun: Free</h3>
                      <p className="text-sm text-gray-600">Upgrade ke premium untuk mendapatkan fitur tambahan</p>
                    </div>
                  </div>
                </div>

                {/* Metode Pembayaran */}
                {renderPaymentMethods()}

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4 bg-gray-50 p-3 rounded-md">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Pembayaran aman & terenkripsi</span>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm mt-4 text-center">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t p-6">
            {currentTransaction && currentTransaction.status === "pending" ? (
              <Button
                onClick={() => router.push("/")}
                variant="default"
                className="w-full neo-btn py-3 h-auto text-base mt-3"
              >
                Kembali ke Beranda
              </Button>
            ) : (
              <Button
                onClick={handlePayment}
                disabled={isLoading}
                variant="success"
                className="w-full py-3 h-auto text-base flex items-center justify-center mt-3"
              >
                {isLoading ? (
                  <>
                    <Clock className="h-5 w-5 mr-2 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    Lanjutkan ke Pembayaran <ChevronRight className="h-5 w-5 ml-1" />
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Riwayat Transaksi di bawah card utama */}
        <Card className="mb-4 neo-card border-2 shadow-sm">{renderTransactionHistory()}</Card>
      </div>
    </div>
  )
}
