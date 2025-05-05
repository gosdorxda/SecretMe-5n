"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { PayPalIcon } from "./icons/paypal-icon"
import { useToast } from "@/hooks/use-toast"

interface PayPalPaymentButtonProps {
  userId: string
  amount: number
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function PayPalPaymentButton({ userId, amount, onSuccess, onError }: PayPalPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handlePayment = async () => {
    setIsLoading(true)

    try {
      // Buat transaksi di server
      const response = await fetch("/api/payment/create-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gateway: "paypal",
          amount,
          userId,
          description: "Premium Membership",
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to create transaction")
      }

      // Redirect ke PayPal
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else {
        throw new Error("No redirect URL provided")
      }
    } catch (error) {
      console.error("Payment error:", error)
      setIsLoading(false)

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat memproses pembayaran",
        variant: "destructive",
      })

      if (onError && error instanceof Error) {
        onError(error)
      }
    }
  }

  return (
    <Button onClick={handlePayment} disabled={isLoading} className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white">
      {isLoading ? (
        <div className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <PayPalIcon className="h-5 w-5" />
          <span>Pay with PayPal</span>
        </div>
      )}
    </Button>
  )
}
