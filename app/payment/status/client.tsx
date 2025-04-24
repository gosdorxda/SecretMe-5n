"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock, XCircle, ArrowRight, RefreshCw, Home } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { LoadingDots } from "@/components/loading-dots"

interface PaymentStatusClientProps {
  transaction: any
}

export function PaymentStatusClient({ transaction }: PaymentStatusClientProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Format tanggal
  const createdAt = formatDate(transaction.created_at)
  const updatedAt = formatDate(transaction.updated_at)

  // Tentukan status dan tampilan berdasarkan status
  const statusConfig = {
    success: {
      title: "Pembayaran Berhasil",
      description: "Terima kasih! Pembayaran Anda telah berhasil diproses.",
      icon: <CheckCircle className="h-12 w-12 text-green-500" />,
      badge: <Badge className="bg-green-500 hover:bg-green-600">Sukses</Badge>,
    },
    pending: {
      title: "Pembayaran Tertunda",
      description: "Pembayaran Anda sedang diproses. Silakan cek kembali nanti.",
      icon: <Clock className="h-12 w-12 text-amber-500" />,
      badge: <Badge className="bg-amber-500 hover:bg-amber-600">Tertunda</Badge>,
    },
    failed: {
      title: "Pembayaran Gagal",
      description: "Maaf, pembayaran Anda tidak dapat diproses. Silakan coba lagi.",
      icon: <XCircle className="h-12 w-12 text-red-500" />,
      badge: <Badge className="bg-red-500 hover:bg-red-600">Gagal</Badge>,
    },
    default: {
      title: "Status Pembayaran",
      description: "Detail transaksi Anda.",
      icon: <AlertCircle className="h-12 w-12 text-gray-500" />,
      badge: <Badge>{transaction.status}</Badge>,
    },
  }

  const status = transaction.status || "default"
  const config = statusConfig[status] || statusConfig.default

  // Fungsi untuk refresh halaman
  const handleRefresh = () => {
    setIsRefreshing(true)
    // Tambahkan delay untuk memberikan pengalaman yang lebih realistis
    setTimeout(() => {
      router.refresh()
      // Tambahkan delay sebelum menghilangkan loading state
      setTimeout(() => setIsRefreshing(false), 800)
    }, 500)
  }

  // Ekstrak detail pembayaran jika ada
  const paymentDetails = transaction.payment_details || {}
  const paymentMethod = transaction.payment_method || paymentDetails.payment_type || "Tidak tersedia"
  const paymentMethodFormatted = formatPaymentMethod(paymentMethod)

  // Format metode pembayaran untuk tampilan yang lebih baik
  function formatPaymentMethod(method: string) {
    const methodMap: Record<string, string> = {
      credit_card: "Kartu Kredit",
      cstore: "Convenience Store",
      bank_transfer: "Transfer Bank",
      echannel: "Mandiri Bill",
      bca_va: "BCA Virtual Account",
      bni_va: "BNI Virtual Account",
      bri_va: "BRI Virtual Account",
      permata_va: "Permata Virtual Account",
      gopay: "GoPay",
      shopeepay: "ShopeePay",
      qris: "QRIS",
      dana: "DANA",
      ovo: "OVO",
      linkaja: "LinkAja",
    }

    return methodMap[method] || method
  }

  // Dapatkan instruksi pembayaran jika ada
  const getPaymentInstructions = () => {
    if (status !== "pending") return null

    // Jika ada data VA atau instruksi lainnya
    const vaNumbers = paymentDetails.va_numbers || []
    const billKey = paymentDetails.bill_key
    const billCode = paymentDetails.biller_code

    if (vaNumbers.length > 0) {
      return (
        <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-2">Instruksi Pembayaran:</h3>
          {vaNumbers.map((va: any, index: number) => (
            <div key={index} className="mb-2">
              <p className="text-sm text-blue-700">Bank: {va.bank.toUpperCase()}</p>
              <p className="text-sm font-mono bg-white px-2 py-1 rounded border border-blue-100 mt-1">
                Nomor VA: {va.va_number}
              </p>
            </div>
          ))}
        </div>
      )
    }

    if (billKey && billCode) {
      return (
        <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-2">Instruksi Pembayaran Mandiri Bill:</h3>
          <p className="text-sm font-mono bg-white px-2 py-1 rounded border border-blue-100 mt-1">
            Bill Key: {billKey}
          </p>
          <p className="text-sm font-mono bg-white px-2 py-1 rounded border border-blue-100 mt-1">
            Biller Code: {billCode}
          </p>
        </div>
      )
    }

    return null
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="relative">
        {isRefreshing && (
          <div
            className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-md"
            aria-live="polite"
            aria-busy="true"
          >
            <LoadingDots className="mb-4" />
            <p className="text-sm font-medium text-muted-foreground animate-pulse">Memperbarui status pembayaran...</p>
          </div>
        )}
        <Card
          className={`bg-white border-2 border-black transition-all duration-200 ${
            isRefreshing ? "opacity-60" : "opacity-100"
          }`}
        >
          <CardHeader className="text-center pb-2 sm:pb-4">
            <div className="mx-auto mb-2 sm:mb-4 inline-flex">{config.icon}</div>
            <CardTitle className="text-xl sm:text-2xl">{config.title}</CardTitle>
            <CardDescription className="text-sm sm:text-base">{config.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              {config.badge}
            </div>

            <Separator className="bg-gray-200" />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ID Pesanan</span>
                <span className="font-mono text-sm">{transaction.plan_id}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tanggal</span>
                <span className="text-sm">{createdAt}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Terakhir Diperbarui</span>
                <span className="text-sm">{updatedAt}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Jumlah</span>
                <span className="font-medium">Rp {transaction.amount.toLocaleString("id-ID")}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Metode Pembayaran</span>
                <span className="text-sm">{paymentMethodFormatted}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Produk</span>
                <span className="text-sm">SecretMe Premium Lifetime</span>
              </div>
            </div>

            {getPaymentInstructions()}

            {status === "success" && (
              <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-100">
                <h3 className="font-medium text-green-800 mb-2">Akun Premium Aktif!</h3>
                <p className="text-sm text-green-700">
                  Selamat! Akun Anda telah diupgrade ke Premium. Nikmati semua fitur eksklusif yang tersedia.
                </p>
              </div>
            )}

            {status === "pending" && (
              <div className="mt-4 p-4 bg-amber-50 rounded-md border border-amber-100">
                <h3 className="font-medium text-amber-800 mb-2">Menunggu Pembayaran</h3>
                <p className="text-sm text-amber-700">
                  Silakan selesaikan pembayaran Anda sesuai instruksi. Status akan diperbarui secara otomatis setelah
                  pembayaran dikonfirmasi.
                </p>
              </div>
            )}

            {status === "failed" && (
              <div className="mt-4 p-4 bg-red-50 rounded-md border border-red-100">
                <h3 className="font-medium text-red-800 mb-2">Pembayaran Gagal</h3>
                <p className="text-sm text-red-700">
                  Pembayaran Anda tidak berhasil diproses. Silakan coba lagi atau gunakan metode pembayaran lain.
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-0 p-4 sm:p-6">
            {status === "pending" && (
              <Button
                className="w-full sm:w-auto"
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label="Perbarui status pembayaran"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Memperbarui...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Perbarui Status
                  </>
                )}
              </Button>
            )}

            {status === "failed" && (
              <Button className="w-full sm:w-auto" onClick={() => router.push("/premium")}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Coba Lagi
              </Button>
            )}

            <Button
              variant={status === "success" ? "default" : "outline"}
              className="w-full sm:w-auto"
              onClick={() => router.push("/dashboard")}
            >
              {status === "success" ? (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Ke Dashboard
                </>
              ) : (
                <>
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
