"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw } from "lucide-react"

export function CheckPayPalStatus({ orderId }: { orderId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleCheckStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/payment/check-paypal-status?order_id=${orderId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to check PayPal status")
      }

      const data = await response.json()

      if (data.success && data.transaction?.status === "success") {
        toast({
          title: "Pembayaran Berhasil!",
          description: "Akun Anda telah diupgrade ke premium.",
          variant: "default",
        })

        // Refresh halaman setelah 2 detik
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else if (data.transaction?.status === "pending") {
        toast({
          title: "Pembayaran Masih Diproses",
          description: "Pembayaran Anda sedang diproses. Silakan coba periksa kembali nanti.",
          variant: "default",
        })
      } else {
        toast({
          title: "Status Pembayaran",
          description: data.message || `Status pembayaran: ${data.transaction?.status || "belum diketahui"}`,
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error checking PayPal status:", error)
      toast({
        title: "Error",
        description: "Gagal memeriksa status pembayaran PayPal",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckStatus}
      disabled={isLoading}
      className="w-full py-3 h-auto bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isLoading ? (
        <>
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
          Memverifikasi Pembayaran...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-5 w-5" />
          Verifikasi Pembayaran PayPal
        </>
      )}
    </Button>
  )
}
