import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PremiumClient } from "./client"

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
      <div className="container max-w-6xl py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Anda Sudah Premium!</h1>
        <p className="text-xl mb-8">Terima kasih telah mendukung kami. Nikmati semua fitur premium.</p>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Kembali ke Dashboard
        </a>
      </div>
    )
  }

  return <PremiumClient />
}
