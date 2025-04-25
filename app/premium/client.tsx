"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createTransaction } from "./actions"

export function PremiumClient() {
  const [isLoading, setIsLoading] = useState(false)
  const [premiumPrice, setPremiumPrice] = useState("499.000")
  const [regularPrice, setRegularPrice] = useState("799.000")
  const [discountPercentage, setDiscountPercentage] = useState(38)
  const { toast } = useToast()

  useEffect(() => {
    // Ambil harga dari environment variable
    const envPrice = process.env.NEXT_PUBLIC_PREMIUM_PRICE
    if (envPrice) {
      // Format harga dengan pemisah ribuan
      const formattedPrice = new Intl.NumberFormat("id-ID").format(Number.parseInt(envPrice))
      setPremiumPrice(formattedPrice)

      // Hitung harga reguler (harga premium / (1 - diskon))
      const priceNum = Number.parseInt(envPrice)
      const regularPriceNum = Math.round(priceNum / (1 - discountPercentage / 100))
      setRegularPrice(new Intl.NumberFormat("id-ID").format(regularPriceNum))
    }
  }, [discountPercentage])

  const handlePayment = async () => {
    try {
      setIsLoading(true)
      toast({
        title: "Memproses",
        description: "Sedang menyiapkan pembayaran...",
      })

      // Gunakan server action untuk membuat transaksi
      // Default ke Duitku sebagai gateway
      const result = await createTransaction("duitku")

      if (!result.success) {
        throw new Error(result.error || "Failed to create transaction")
      }

      // Redirect ke halaman pembayaran
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
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Upgrade ke Premium</h1>
        <p className="text-muted-foreground">Nikmati pengalaman SecretMe tanpa batas dengan akun premium</p>
      </div>

      <Card className="border border-gray-200 rounded-md overflow-hidden bg-white">
        <div className="p-6">
          <div className="inline-block bg-amber-500 text-black font-semibold px-4 py-1.5 rounded-md mb-4">
            PENAWARAN SPESIAL
          </div>

          <h2 className="text-3xl font-bold mb-4">
            <span className="text-black">Sekali Bayar, </span>
            <span className="text-blue-500">Akses Selamanya!</span>
          </h2>

          <p className="text-gray-700 mb-6">
            Dapatkan semua fitur premium SecretMe dengan pembayaran satu kali. Tanpa biaya berlangganan bulanan!
          </p>

          <div className="border border-gray-200 rounded-md p-4 bg-white mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold">Rp {premiumPrice}</span>
                  <span className="text-gray-500 line-through">Rp {regularPrice}</span>
                </div>
                <p className="text-gray-700 mt-1 text-sm">
                  Pembayaran sekali, akses seumur hidup ke semua fitur premium
                </p>
              </div>
              <div className="bg-red-500 text-white px-3 py-1 rounded-md font-medium">Hemat {discountPercentage}%</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-amber-500 rounded-full p-1 mt-0.5 flex-shrink-0">
                  <Check className="h-4 w-4 text-black" />
                </div>
                <span>Link dan username kustom selamanya</span>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-amber-500 rounded-full p-1 mt-0.5 flex-shrink-0">
                  <Check className="h-4 w-4 text-black" />
                </div>
                <span>Notifikasi WhatsApp & Email tanpa batas</span>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-amber-500 rounded-full p-1 mt-0.5 flex-shrink-0">
                  <Check className="h-4 w-4 text-black" />
                </div>
                <span>Statistik lengkap & analitik pesan selamanya</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-amber-500 rounded-full p-1 mt-0.5 flex-shrink-0">
                  <Check className="h-4 w-4 text-black" />
                </div>
                <span>Tanpa iklan & prioritas dukungan seumur hidup</span>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-amber-500 rounded-full p-1 mt-0.5 flex-shrink-0">
                  <Check className="h-4 w-4 text-black" />
                </div>
                <span>Semua update fitur premium di masa depan</span>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-green-500 rounded-full p-1 mt-0.5 flex-shrink-0">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <span>Garansi 30 hari uang kembali. Tanpa risiko!</span>
              </div>
            </div>
          </div>

          <div className="mt-8 relative">
            <div className="relative z-10 mx-auto max-w-xs">
              <div className="transform -rotate-3 border border-gray-200 rounded-md p-3 bg-white shadow-sm">
                <div className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-medium inline-block mb-2">
                  Premium Lifetime
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 bg-gray-200 rounded-full w-full"></div>
                  <div className="h-2 bg-gray-200 rounded-full w-3/4"></div>
                </div>
                <div className="flex justify-between items-center mt-3 text-xs">
                  <div>
                    <div className="font-bold">152</div>
                    <div>pesan</div>
                  </div>
                  <div>
                    <div className="font-bold">89%</div>
                    <div>Positif</div>
                  </div>
                  <div>
                    <div className="font-bold">320</div>
                    <div>Views</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button
            className="w-full mt-8 bg-amber-500 hover:bg-amber-600 text-black font-bold"
            size="lg"
            onClick={handlePayment}
            disabled={isLoading}
          >
            {isLoading ? "Memproses..." : "Upgrade ke Premium Sekarang"}
          </Button>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <img src="/payment-icons/bca.png" alt="BCA" className="h-6" />
            <img src="/payment-icons/mandiri.png" alt="Mandiri" className="h-6" />
            <img src="/payment-icons/bni.png" alt="BNI" className="h-6" />
            <img src="/payment-icons/bri.png" alt="BRI" className="h-6" />
            <img src="/payment-icons/qris.png" alt="QRIS" className="h-6" />
            <img src="/payment-icons/dana.png" alt="DANA" className="h-6" />
            <img src="/payment-icons/ovo.png" alt="OVO" className="h-6" />
            <img src="/payment-icons/shopeepay.png" alt="ShopeePay" className="h-6" />
          </div>
        </div>
      </Card>
    </div>
  )
}
