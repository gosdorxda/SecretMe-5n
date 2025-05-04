"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw, CheckCircle } from "lucide-react"

interface CheckPayPalStatusProps {
  orderId: string
  paypalOrderId?: string // ID order PayPal yang sebenarnya
}

export function CheckPayPalStatus({ orderId, paypalOrderId }: CheckPayPalStatusProps) {
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

  const handleCheckStatus = async () => {
    try {
      setIsChecking(true)

      // Gunakan paypalOrderId jika tersedia, jika tidak gunakan orderId
      const idToCheck = paypalOrderId || orderId

      const response = await fetch(`/api/payment/check-paypal-status?orderId=${encodeURIComponent(idToCheck)}`)
      const data = await response.json()

      setIsChecking(false)

      if (data.success) {
        if (data.status === "success") {
          toast({
            title: "Pembayaran Berhasil!",
            description: "Akun Anda telah diupgrade ke Premium. Halaman akan dimuat ulang.",
            variant: "default",
          })
          // Reload halaman setelah 2 detik
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        } else {
          toast({
            title: `Status Pembayaran: ${data.status}`,
            description: `Status PayPal: ${data.paypalStatus}`,
            variant: "default",
          })
        }
      } else {
        toast({
          title: "Gagal Memeriksa Status",
          description: data.error || "Terjadi kesalahan saat memeriksa status pembayaran",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking PayPal status:", error)
      setIsChecking(false)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memeriksa status pembayaran",
        variant: "destructive",
      })
    }
  }

  return (
    <Button
      onClick={handleCheckStatus}
      disabled={isChecking}
      variant="outline"
      className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
    >
      {isChecking ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
      {isChecking ? "Memeriksa Status..." : "Verifikasi Pembayaran PayPal"}
    </Button>
  )
}
