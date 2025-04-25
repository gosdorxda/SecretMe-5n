"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react"

interface Transaction {
  id: string
  plan_id: string
  amount: number
  status: string
  payment_method: string
  created_at: string
  updated_at: string
}

export function PaymentStatusPage() {
  const searchParams = useSearchParams()
  const status = searchParams.get("status")
  const orderId = searchParams.get("order_id")

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Fungsi untuk memeriksa status transaksi
  const checkTransactionStatus = async () => {
    if (!orderId) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/payment/check-status?order_id=${orderId}`)

      if (!response.ok) {
        throw new Error("Failed to check transaction status")
      }

      const data = await response.json()
      setTransaction(data.transaction)

      // Jika status berubah menjadi success, tampilkan toast
      if (data.status === "success" && status !== "success") {
        toast({
          title: "Pembayaran Berhasil!",
          description: "Akun Anda telah diupgrade ke premium.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error checking transaction status:", error)
      toast({
        title: "Error",
        description: "Gagal memeriksa status transaksi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Periksa status saat komponen dimuat
  useEffect(() => {
    if (orderId) {
      checkTransactionStatus()
    }
  }, [orderId])

  // Jika tidak ada status atau order_id, jangan tampilkan apa-apa
  if (!status || !orderId) {
    return null
  }

  // Format jumlah uang
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Tampilkan status transaksi
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {transaction?.status === "success" ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Pembayaran Berhasil</span>
              </>
            ) : transaction?.status === "failed" || transaction?.status === "expired" ? (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <span>Pembayaran Gagal</span>
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-yellow-500" />
                <span>Pembayaran Tertunda</span>
              </>
            )}
          </CardTitle>
          <CardDescription>
            {transaction?.status === "success"
              ? "Terima kasih! Akun Anda telah diupgrade ke premium."
              : transaction?.status === "failed" || transaction?.status === "expired"
                ? "Pembayaran Anda tidak berhasil. Silakan coba lagi."
                : "Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transaction && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Transaksi:</span>
                <span className="font-mono">{transaction.plan_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah:</span>
                <span>{formatCurrency(transaction.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metode Pembayaran:</span>
                <span>{transaction.payment_method || "Belum dipilih"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span
                  className={
                    transaction.status === "success"
                      ? "text-green-500"
                      : transaction.status === "failed" || transaction.status === "expired"
                        ? "text-red-500"
                        : "text-yellow-500"
                  }
                >
                  {transaction.status === "success"
                    ? "Berhasil"
                    : transaction.status === "failed"
                      ? "Gagal"
                      : transaction.status === "expired"
                        ? "Kadaluarsa"
                        : "Tertunda"}
                </span>
              </div>
            </div>
          )}

          {transaction?.status === "pending" && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={checkTransactionStatus}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Memeriksa...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Periksa Status Pembayaran
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
