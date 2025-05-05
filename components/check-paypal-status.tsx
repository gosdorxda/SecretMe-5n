"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw } from "lucide-react"

interface CheckPayPalStatusProps {
  orderId: string
  gatewayReference?: string
  onSuccess?: () => void
}

export function CheckPayPalStatus({ orderId, gatewayReference, onSuccess }: CheckPayPalStatusProps) {
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

  const handleCheckStatus = async () => {
    setIsChecking(true)
    try {
      // Gunakan orderId untuk memeriksa status
      const response = await fetch(`/api/payment/check-paypal-status?order_id=${orderId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Gagal memeriksa status pembayaran")
      }

      const data = await response.json()

      if (data.transaction?.status === "success") {
        toast({
          title: "Pembayaran Berhasil!",
          description: "Akun Anda telah diupgrade ke Premium. Halaman akan dimuat ulang.",
        })

        // Jika ada callback onSuccess, panggil
        if (onSuccess) {
          onSuccess()
        } else {
          // Reload halaman setelah 2 detik
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }
      } else if (data.transaction?.status === "pending") {
        toast({
          title: "Pembayaran Masih Diproses",
          description: "Pembayaran Anda sedang diproses. Silakan coba periksa kembali nanti.",
          variant: "default",
        })
      } else {
        toast({
          title: "Status Pembayaran",
          description: `Status: ${data.transaction?.status || "unknown"}`,
          variant: "default",
        })
      }
    } catch (error: any) {
      console.error("Error checking PayPal status:", error)
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan saat memeriksa status pembayaran",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Button onClick={handleCheckStatus} disabled={isChecking} className="w-full" variant="outline">
      {isChecking ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Memeriksa Status...
        </>
      ) : (
        "Verifikasi Pembayaran PayPal"
      )}
    </Button>
  )
}
