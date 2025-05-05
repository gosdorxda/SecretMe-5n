"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import Script from "next/script"

interface PayPalButtonProps {
  amount: number
  currency?: string
  onSuccess?: (details: any) => void
  onError?: (error: any) => void
  onCancel?: () => void
  className?: string
  style?: React.CSSProperties
  orderId: string
  successUrl: string
  cancelUrl: string
}

export function PayPalButton({
  amount,
  currency = "USD",
  onSuccess,
  onError,
  onCancel,
  className = "",
  style = {},
  orderId,
  successUrl,
  cancelUrl,
}: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null)
  const amountUSD = (amount / 15000).toFixed(2) // Konversi dari IDR ke USD

  useEffect(() => {
    // Pastikan window.paypal tersedia setelah script dimuat
    if (window.paypal && paypalRef.current) {
      try {
        window.paypal
          .Buttons({
            createOrder: (data: any, actions: any) => {
              return actions.order.create({
                purchase_units: [
                  {
                    description: "Premium Membership",
                    amount: {
                      currency_code: currency,
                      value: amountUSD,
                    },
                    custom_id: orderId,
                  },
                ],
              })
            },
            onApprove: async (data: any, actions: any) => {
              const details = await actions.order.capture()
              if (onSuccess) {
                onSuccess(details)
              }
              // Redirect ke halaman sukses
              window.location.href = `${successUrl}?order_id=${orderId}&status=success`
            },
            onError: (err: any) => {
              console.error("PayPal Error:", err)
              if (onError) {
                onError(err)
              }
              // Redirect ke halaman error
              window.location.href = `${cancelUrl}?order_id=${orderId}&status=failed`
            },
            onCancel: () => {
              if (onCancel) {
                onCancel()
              }
              // Redirect ke halaman cancel
              window.location.href = `${cancelUrl}?order_id=${orderId}&status=cancelled`
            },
            style: {
              layout: "vertical",
              color: "blue",
              shape: "rect",
              label: "pay",
            },
          })
          .render(paypalRef.current)
      } catch (error) {
        console.error("Error rendering PayPal buttons:", error)
      }
    }
  }, [amountUSD, currency, onSuccess, onError, onCancel, orderId, successUrl, cancelUrl])

  return (
    <>
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=${currency}`}
        strategy="afterInteractive"
      />
      <div ref={paypalRef} className={className} style={style}></div>
    </>
  )
}
