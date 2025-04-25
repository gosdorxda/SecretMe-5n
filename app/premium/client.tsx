"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { LoadingDots } from "@/components/loading-dots"
import { createTransaction, getLatestTransaction, getTransactionHistory, cancelTransaction } from "./actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Clock, RefreshCw, Home, X, History } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

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

type PremiumClientProps = {
  isLoggedIn: boolean
  isPremium: boolean
  userName: string
  premiumPrice: number
  urlStatus?: string
  urlOrderId?: string
  transaction?: Transaction | null
}

export function PremiumClient({
  isLoggedIn,
  isPremium,
  userName,
  premiumPrice,
  urlStatus,
  urlOrderId,
  transaction,
}: PremiumClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("duitku")
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(transaction || null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [cancellingTransaction, setCancellingTransaction] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

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

  // Fungsi untuk menangani pembayaran
  const handlePayment = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Panggil server action untuk membuat transaksi
      const result = await createTransaction(selectedPaymentMethod)

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
    let statusDescription
    let statusColor

    switch (currentTransaction.status) {
      case "success":
        statusIcon = <CheckCircle className="h-6 w-6 text-green-500" />
        statusTitle = "Pembayaran Berhasil"
        statusDescription = "Akun Anda telah diupgrade ke Premium."
        statusColor = "border-green-200 bg-green-50"
        break
      case "failed":
        statusIcon = <AlertCircle className="h-6 w-6 text-red-500" />
        statusTitle = "Pembayaran Gagal"
        statusDescription = "Silakan coba lagi atau gunakan metode pembayaran lain."
        statusColor = "border-red-200 bg-red-50"
        break
      case "cancelled":
        statusIcon = <X className="h-6 w-6 text-red-500" />
        statusTitle = "Pembayaran Dibatalkan"
        statusDescription = "Transaksi Anda telah dibatalkan."
        statusColor = "border-red-200 bg-red-50"
        break
      case "pending":
      default:
        statusIcon = <Clock className="h-6 w-6 text-yellow-500" />
        statusTitle = "Pembayaran Tertunda"
        statusDescription = "Kami sedang menunggu konfirmasi pembayaran Anda."
        statusColor = "border-yellow-200 bg-yellow-50"
    }

    return (
      <Alert className={`mb-6 ${statusColor}`}>
        <div className="flex items-start">
          <div className="mr-3 mt-0.5">{statusIcon}</div>
          <div className="flex-1">
            <AlertTitle>{statusTitle}</AlertTitle>
            <AlertDescription>
              {statusDescription}
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Order ID: {currentTransaction.orderId}</p>
                <p>
                  Metode Pembayaran:{" "}
                  {currentTransaction.paymentMethod ? currentTransaction.paymentMethod : "Belum dipilih"}
                </p>
                <p>Jumlah: Rp {currentTransaction.amount.toLocaleString("id-ID")}</p>
              </div>
            </AlertDescription>
            <div className="mt-3 flex flex-wrap gap-2">
              {currentTransaction.status === "pending" && (
                <>
                  <Button variant="outline" size="sm" onClick={checkTransactionStatus} disabled={checkingStatus}>
                    {checkingStatus ? (
                      <LoadingDots />
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" /> Periksa Status
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelTransaction}
                    disabled={cancellingTransaction}
                  >
                    {cancellingTransaction ? (
                      <LoadingDots />
                    ) : (
                      <>
                        <X className="mr-2 h-4 w-4" /> Batalkan
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => router.push("/")}>
                    <Home className="mr-2 h-4 w-4" /> Kembali ke Beranda
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Alert>
    )
  }

  // Render riwayat transaksi
  const renderTransactionHistory = () => {
    return (
      <Accordion type="single" collapsible className="mt-6">
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

  // Jika user sudah premium, tampilkan pesan sukses
  if (isPremium) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Akun Premium</CardTitle>
              <CardDescription>Selamat! Anda telah berhasil mengupgrade ke akun Premium.</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="border-green-200 bg-green-50">
                <div className="flex items-start">
                  <CheckCircle className="mr-3 mt-0.5 h-6 w-6 text-green-500" />
                  <div>
                    <AlertTitle>Akun Premium Aktif</AlertTitle>
                    <AlertDescription>
                      Terima kasih telah menjadi pengguna premium. Nikmati semua fitur eksklusif SecretMe tanpa batasan.
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Fitur Premium Anda</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Tanpa iklan dan gangguan</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Akses ke semua fitur eksklusif</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Prioritas dukungan pelanggan</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Penyimpanan pesan tanpa batas</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Fitur balasan publik</span>
                  </li>
                </ul>
              </div>

              {/* Riwayat Transaksi untuk pengguna premium */}
              {renderTransactionHistory()}
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push("/dashboard")} className="w-full">
                Kembali ke Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Upgrade ke Premium</CardTitle>
            <CardDescription>
              Nikmati fitur premium tanpa batasan dan tingkatkan pengalaman Anda dengan SecretMe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {/* Tampilkan status transaksi jika ada */}
              {renderTransactionStatus()}

              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Keuntungan Premium</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Tanpa iklan dan gangguan</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Akses ke semua fitur eksklusif</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Prioritas dukungan pelanggan</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Penyimpanan pesan tanpa batas</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Fitur balasan publik</span>
                  </li>
                </ul>
              </div>

              {/* Riwayat Transaksi */}
              {renderTransactionHistory()}

              {/* Hanya tampilkan form pembayaran jika tidak ada transaksi pending */}
              {!currentTransaction ||
              currentTransaction.status === "failed" ||
              currentTransaction.status === "cancelled" ? (
                <div className="border rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">Premium Lifetime</h3>
                      <p className="text-muted-foreground">Akses seumur hidup, bayar sekali</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">Rp {premiumPrice.toLocaleString("id-ID")}</div>
                      <div className="text-sm text-muted-foreground">Harga sudah termasuk pajak</div>
                    </div>
                  </div>

                  <Tabs defaultValue="duitku" className="w-full">
                    <TabsList className="grid grid-cols-2 mb-4">
                      <TabsTrigger value="duitku" onClick={() => setSelectedPaymentMethod("duitku")}>
                        Duitku
                      </TabsTrigger>
                      <TabsTrigger value="midtrans" onClick={() => setSelectedPaymentMethod("midtrans")}>
                        Midtrans
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="duitku" className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/bca.png"
                            alt="BCA"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/mandiri.png"
                            alt="Mandiri"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/bni.png"
                            alt="BNI"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/bri.png"
                            alt="BRI"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/permata.png"
                            alt="Permata"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/cimb.png"
                            alt="CIMB"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/alfamart.png"
                            alt="Alfamart"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/dana.png"
                            alt="DANA"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/linkaja.png"
                            alt="LinkAja"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/ovo.png"
                            alt="OVO"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/shopeepay.png"
                            alt="ShopeePay"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/qris.png"
                            alt="QRIS"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="midtrans" className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/visa.png"
                            alt="Visa"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/bca.png"
                            alt="BCA"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/mandiri.png"
                            alt="Mandiri"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/bni.png"
                            alt="BNI"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/bri.png"
                            alt="BRI"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                        <div className="border rounded p-2 flex justify-center items-center">
                          <Image
                            src="/payment-icons/permata.png"
                            alt="Permata"
                            width={60}
                            height={30}
                            className="h-8 w-auto object-contain"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
                </div>
              ) : null}
            </div>
          </CardContent>
          <CardFooter>
            {!currentTransaction ||
            currentTransaction.status === "failed" ||
            currentTransaction.status === "cancelled" ? (
              <Button onClick={handlePayment} disabled={isLoading} className="w-full">
                {isLoading ? <LoadingDots /> : "Lanjutkan ke Pembayaran"}
              </Button>
            ) : null}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
