"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createTransaction, getAvailablePaymentMethods } from "@/lib/payment/client-gateway"
import type { PaymentMethod } from "@/lib/payment/types"
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LoadingSpinner } from "@/components/loading-spinner"

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

interface PremiumClientProps {
  user: {
    id: string
    email: string
    name?: string
    phone?: string
  }
  premiumPrice: number
}

export function PremiumClient({ user, premiumPrice }: PremiumClientProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [name, setName] = useState(user.name || "")
  const [phone, setPhone] = useState(user.phone || "")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function loadPaymentMethods() {
      try {
        const methods = await getAvailablePaymentMethods()
        setPaymentMethods(methods)
        if (methods.length > 0) {
          setSelectedMethod(methods[0].code)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Gagal memuat metode pembayaran",
          variant: "destructive",
        })
      } finally {
        setInitialLoading(false)
      }
    }

    loadPaymentMethods()
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMethod) {
      toast({
        title: "Error",
        description: "Silakan pilih metode pembayaran",
        variant: "destructive",
      })
      return
    }

    if (!name || !phone) {
      toast({
        title: "Error",
        description: "Nama dan nomor telepon harus diisi",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const result = await createTransaction(selectedMethod, premiumPrice, name, user.email, phone)

      if (result.redirectUrl) {
        router.push(result.redirectUrl)
      } else if (result.paymentUrl) {
        router.push(result.paymentUrl)
      } else {
        router.push(`/payment-status?reference=${result.reference}`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal membuat transaksi. Silakan coba lagi.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Upgrade ke Premium</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="Contoh: 08123456789"
              type="tel"
            />
          </div>

          <div className="space-y-3">
            <Label>Pilih Metode Pembayaran</Label>
            {paymentMethods.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada metode pembayaran yang tersedia saat ini</p>
            ) : (
              <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="space-y-2">
                {paymentMethods.map((method) => (
                  <div
                    key={method.code}
                    className="flex items-center space-x-2 border rounded-md p-3 hover:bg-accent cursor-pointer"
                    onClick={() => setSelectedMethod(method.code)}
                  >
                    <RadioGroupItem value={method.code} id={method.code} />
                    <Label htmlFor={method.code} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span>{method.name}</span>
                        {method.icon && (
                          <Image
                            src={method.icon || "/placeholder.svg"}
                            alt={method.name}
                            width={40}
                            height={24}
                            className="object-contain"
                          />
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={loading || paymentMethods.length === 0}>
              {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Bayar Rp {premiumPrice.toLocaleString("id-ID")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
