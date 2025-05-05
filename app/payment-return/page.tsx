import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function PaymentReturn({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Ambil status dari query params
  const status = searchParams.status as string
  const custom = searchParams.custom as string // user_id dari PayPal

  // Redirect ke dashboard jika tidak ada status
  if (!status && !custom) {
    redirect("/dashboard")
  }

  let title = "Status Pembayaran"
  let description = "Terima kasih telah melakukan pembayaran."
  let icon = <Clock className="h-12 w-12 text-yellow-500" />
  let statusText = "pending"

  // Jika ada custom (user_id), cek status di database
  if (custom) {
    const supabase = createClient()

    // Cari transaksi terbaru untuk user ini
    const { data: transaction } = await supabase
      .from("premium_transactions")
      .select("status")
      .eq("user_id", custom)
      .eq("payment_gateway", "paypal")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (transaction) {
      if (transaction.status === "success") {
        title = "Pembayaran Berhasil"
        description = "Terima kasih! Pembayaran Anda telah berhasil diproses. Akun Anda telah diupgrade ke Premium."
        icon = <CheckCircle className="h-12 w-12 text-green-500" />
        statusText = "success"
      } else if (transaction.status === "pending") {
        title = "Pembayaran Sedang Diproses"
        description =
          "Pembayaran Anda sedang diproses. Mohon tunggu beberapa saat sampai kami menerima konfirmasi dari PayPal."
        icon = <Clock className="h-12 w-12 text-yellow-500" />
        statusText = "pending"
      } else {
        title = "Pembayaran Gagal"
        description =
          "Maaf, pembayaran Anda tidak dapat diproses. Silakan coba lagi atau gunakan metode pembayaran lain."
        icon = <AlertCircle className="h-12 w-12 text-red-500" />
        statusText = "failed"
      }
    } else {
      // Jika tidak ada transaksi, tampilkan pesan menunggu
      title = "Pembayaran Sedang Diproses"
      description = "Kami sedang menunggu konfirmasi dari PayPal. Ini mungkin memerlukan waktu beberapa menit."
      icon = <Clock className="h-12 w-12 text-yellow-500" />
      statusText = "pending"
    }
  }

  return (
    <div className="container max-w-md mx-auto py-12 px-4">
      <Card className="shadow-lg border-2">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">{icon}</div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 pb-2">
          <div
            className={`p-4 rounded-md ${
              statusText === "success"
                ? "bg-green-50 border border-green-100"
                : statusText === "pending"
                  ? "bg-yellow-50 border border-yellow-100"
                  : "bg-red-50 border border-red-100"
            }`}
          >
            <p className="text-sm">
              {statusText === "success"
                ? "Akun Anda telah berhasil diupgrade ke Premium. Nikmati semua fitur premium!"
                : statusText === "pending"
                  ? "Pembayaran Anda sedang diproses. Halaman ini akan diperbarui secara otomatis setelah pembayaran dikonfirmasi."
                  : "Pembayaran Anda gagal. Silakan coba lagi atau hubungi dukungan pelanggan jika masalah berlanjut."}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/premium">Kembali ke Premium</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
