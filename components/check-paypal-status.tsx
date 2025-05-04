"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"

interface CheckPayPalStatusProps {
  orderId: string
  paypalOrderId?: string
}

export function CheckPayPalStatus({ orderId, paypalOrderId }: CheckPayPalStatusProps) {
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

  const checkStatus = async () => {
    setIsChecking(true)
    try {
      // Gunakan paypalOrderId jika tersedia, jika tidak gunakan orderId
      const idToCheck = orderId

      const response = await fetch(`/api/payment/check-paypal-status?order_id=${idToCheck}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Gagal memeriksa status pembayaran")
      }

      if (data.transaction.status === "success") {
        toast({
          title: "Pembayaran Berhasil!",
          description: "Akun Anda telah diupgrade ke Premium.",
          variant: "success",
        })

        // Refresh halaman setelah 2 detik
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else if (data.transaction.status === "pending") {
        toast({
          title: "Pembayaran Masih Diproses",
          description: "Pembayaran Anda sedang diproses. Silakan coba periksa kembali nanti.",
          variant: "default",
        })
      } else {
        toast({
          title: "Pembayaran Belum Selesai",
          description: "Status pembayaran: " + data.transaction.status,
          variant: "destructive",
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
    <Button onClick={checkStatus} disabled={isChecking} className="w-full" variant="outline">
      {isChecking ? (
        <>
          <LoadingSpinner className="mr-2 h-4 w-4" />
          Memeriksa Status...
        </>
      ) : (
        "Verifikasi Pembayaran PayPal"
      )}
    </Button>
  )
}
