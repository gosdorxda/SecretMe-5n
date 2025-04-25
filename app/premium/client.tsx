"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { LoadingDots } from "@/components/loading-dots"
import { createTransaction } from "./actions"

export function PremiumClient() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("duitku")
  const router = useRouter()
  const { toast } = useToast()

  // Fungsi untuk menangani pembayaran
  const handlePayment = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Panggil server action untuk membuat transaksi
      const result = await createTransaction(selectedPaymentMethod)

      if (!result.success) {
        setError(result.error || "Terjadi kesalahan saat memproses pembayaran")
        setIsLoading(false)
        return
      }

      // PENTING: Redirect ke URL pembayaran dari gateway, bukan ke halaman status
      if (result.redirectUrl) {
        // Redirect ke URL pembayaran dari gateway
        window.location.href = result.redirectUrl
      } else {
        // Jika tidak ada redirectUrl, tampilkan pesan error
        setError("Tidak mendapatkan URL pembayaran dari gateway")
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error("Error processing payment:", error)
      setError(error.message || "Terjadi kesalahan saat memproses pembayaran")
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Upgrade ke Premium</CardTitle>
            <CardDescription>
              Nikmati fitur premium tanpa batasan dan tingkatkan pengalaman Anda dengan SecretMe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Keuntungan Premium</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Tanpa iklan dan gangguan</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Akses ke semua fitur eksklusif</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Prioritas dukungan pelanggan</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Penyimpanan pesan tanpa batas</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Fitur balasan publik</span>
                  </li>
                </ul>
              </div>

              <div className="border rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">Premium Lifetime</h3>
                    <p className="text-muted-foreground">Akses seumur hidup, bayar sekali</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">Rp 49.000</div>
                    <div className="text-sm text-muted-foreground">Harga sudah termasuk pajak</div>
                  </div>
                </div>

                <Tabs defaultValue="duitku" className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="duitku" onClick={() => setSelectedPaymentMethod("duitku")}>
                      Duitku
                    </TabsTrigger>
                    <TabsTrigger value="midtrans" onClick={() => setSelectedPaymentMethod("midtrans")}>
                      Midtrans
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="duitku" className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/bca.png"
                          alt="BCA"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/mandiri.png"
                          alt="Mandiri"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/bni.png"
                          alt="BNI"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/bri.png"
                          alt="BRI"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/permata.png"
                          alt="Permata"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/cimb.png"
                          alt="CIMB"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/alfamart.png"
                          alt="Alfamart"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/dana.png"
                          alt="DANA"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/linkaja.png"
                          alt="LinkAja"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/ovo.png"
                          alt="OVO"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/shopeepay.png"
                          alt="ShopeePay"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/qris.png"
                          alt="QRIS"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="midtrans" className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/visa.png"
                          alt="Visa"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/bca.png"
                          alt="BCA"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/mandiri.png"
                          alt="Mandiri"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/bni.png"
                          alt="BNI"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/bri.png"
                          alt="BRI"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div className="border rounded p-2 flex justify-center items-center">
                        <Image
                          src="/payment-icons/permata.png"
                          alt="Permata"
                          width={60}
                          height={30}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handlePayment} disabled={isLoading} className="w-full">
              {isLoading ? <LoadingDots /> : "Lanjutkan ke Pembayaran"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
