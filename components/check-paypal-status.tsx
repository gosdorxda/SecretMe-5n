"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

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
      // Use gatewayReference if available, otherwise use orderId
      const idToCheck = gatewayReference || orderId

      const response = await fetch(`/api/payment/check-paypal-status?orderId=${idToCheck}`)
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Status pembayaran berhasil diperbarui",
          description: data.message,
          variant: "success",
        })

        // If payment is successful and onSuccess callback is provided, call it
        if (data.status === "success" && onSuccess) {
          onSuccess()
        }

        // Reload the page if payment is successful to show updated status
        if (data.status === "success") {
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }
      } else {
        toast({
          title: "Gagal memeriksa status pembayaran",
          description: data.error || "Terjadi kesalahan saat memeriksa status pembayaran",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking PayPal status:", error)
      toast({
        title: "Gagal memeriksa status pembayaran",
        description: "Terjadi kesalahan saat memeriksa status pembayaran",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Button onClick={handleCheckStatus} disabled={isChecking} variant="outline" className="mt-2 w-full">
      {isChecking ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Memeriksa Status...
        </>
      ) : (
        "Verifikasi Pembayaran PayPal"
      )}
    </Button>
  )
}
