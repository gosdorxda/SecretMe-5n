import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PremiumClient } from "./client"
import { Card } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function PremiumPage() {
  const supabase = createClient()

  // Cek apakah user sudah login
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login?redirect=/premium")
  }

  // Cek apakah user sudah premium
  const { data: userData } = await supabase.from("users").select("is_premium").eq("id", user.id).single()

  if (userData?.is_premium) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Card className="border border-gray-200 rounded-md overflow-hidden bg-white p-8 text-center">
          <div className="inline-flex justify-center items-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-600"
            >
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4">Anda Sudah Premium!</h1>
          <p className="text-xl mb-6 text-muted-foreground max-w-lg mx-auto">
            Terima kasih telah mendukung kami. Nikmati semua fitur premium tanpa batasan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-amber-500 text-black hover:bg-amber-600 h-10 px-4 py-2"
            >
              Kembali ke Dashboard
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Kunjungi Beranda
            </a>
          </div>
        </Card>
      </div>
    )
  }

  return <PremiumClient />
}
