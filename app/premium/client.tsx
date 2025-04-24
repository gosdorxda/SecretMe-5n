"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createTransaction } from "./actions"

export function PremiumClient() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handlePayment = async () => {
    try {
      setIsLoading(true)
      toast({
        title: "Memproses",
        description: "Sedang menyiapkan pembayaran...",
      })

      // Gunakan server action untuk membuat transaksi
      const result = await createTransaction()

      if (!result.success) {
        throw new Error(result.error || "Failed to create transaction")
      }

      // Redirect ke halaman pembayaran Midtrans
      window.location.href = result.redirectUrl
    } catch (error: any) {
      console.error("Payment error:", error)
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan saat memproses pembayaran.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Upgrade ke Premium</h1>
        <p className="text-muted-foreground">Nikmati fitur eksklusif dengan upgrade ke akun premium</p>
      </div>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Premium Lifetime</CardTitle>
          <div className="mt-2">
            <span className="text-3xl font-bold">Rp 49.000</span>
            <span className="text-muted-foreground ml-1">sekali bayar</span>
          </div>
          <CardDescription>Akses premium seumur hidup</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center">
              <Check className="mr-2 h-5 w-5 text-green-500" />
              <span>Tanpa iklan</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-5 w-5 text-green-500" />
              <span>Balas pesan tanpa batas</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-5 w-5 text-green-500" />
              <span>Kustomisasi profil lanjutan</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-5 w-5 text-green-500" />
              <span>Prioritas dukungan pelanggan</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-5 w-5 text-green-500" />
              <span>Fitur premium mendatang</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button className="w-full" size="lg" onClick={handlePayment} disabled={isLoading}>
            {isLoading ? "Memproses..." : "Upgrade Sekarang"}
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Metode Pembayaran</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <img src="/payment-icons/bca.png" alt="BCA" className="h-8" />
          <img src="/payment-icons/mandiri.png" alt="Mandiri" className="h-8" />
          <img src="/payment-icons/bni.png" alt="BNI" className="h-8" />
          <img src="/payment-icons/bri.png" alt="BRI" className="h-8" />
          <img src="/payment-icons/permata.png" alt="Permata" className="h-8" />
          <img src="/payment-icons/qris.png" alt="QRIS" className="h-8" />
          <img src="/payment-icons/dana.png" alt="DANA" className="h-8" />
          <img src="/payment-icons/ovo.png" alt="OVO" className="h-8" />
          <img src="/payment-icons/shopeepay.png" alt="ShopeePay" className="h-8" />
          <img src="/payment-icons/linkaja.png" alt="LinkAja" className="h-8" />
        </div>
      </div>
    </div>
  )
}
