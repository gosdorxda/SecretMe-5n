"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

interface CheckPayPalStatusProps {
  orderId: string
}

export function CheckPayPalStatus({ orderId }: CheckPayPalStatusProps) {
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const checkPayPalStatus = async () => {
    if (!orderId) return

    try {
      setIsChecking(true)

      const response = await fetch(`/api/payment/check-paypal-status?orderId=${encodeURIComponent(orderId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        if (data.status === "COMPLETED" || data.status === "success") {
          toast({
            title: "Pembayaran Berhasil!",
            description: "Akun Anda telah diupgrade ke Premium.",
            variant: "default",
          })
          // Refresh halaman untuk menampilkan status premium
          router.refresh()
        } else if (data.status === "FAILED" || data.status === "failed") {
          toast({
            title: "Pembayaran Gagal",
            description: "Silakan coba lagi atau gunakan metode pembayaran lain.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Status Pembayaran",
            description: `Status pembayaran PayPal Anda: ${data.status}`,
          })
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Gagal memeriksa status pembayaran PayPal",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking PayPal status:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memeriksa status pembayaran PayPal",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Button
      onClick={checkPayPalStatus}
      disabled={isChecking}
      variant="outline"
      className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800 py-3 h-auto"
    >
      {isChecking ? (
        <>
          <Clock className="h-5 w-5 mr-2 animate-spin" /> Memeriksa Status PayPal...
        </>
      ) : (
        <>
          <RefreshCw className="h-5 w-5 mr-2" /> Verifikasi Pembayaran PayPal
        </>
      )}
    </Button>
  )
}
