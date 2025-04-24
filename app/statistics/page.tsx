import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TopUsersTable } from "./top-users-table"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Statistik Pengguna - SecretMe",
  description: "Daftar pengguna dengan jumlah pesan terbanyak di SecretMe",
}

export default async function StatisticsPage() {
  const supabase = createClient()

  // Cek session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login?redirect=/statistics")
  }

  // Verifikasi user dengan getUser()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Error verifying user:", userError)
    redirect("/login?redirect=/statistics")
  }

  // Gunakan user.id yang terverifikasi untuk query
  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Ambil 10 pengguna teratas berdasarkan jumlah pesan
  const { data: topUsers, error } = await supabase
    .from("message_stats")
    .select("*")
    .order("total_messages", { ascending: false })
    .limit(10)

  if (error) {
    console.error("Error fetching top users:", error)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-4">Statistik Pengguna</h1>
      <p className="text-center text-gray-600 mb-8">Pengguna dengan jumlah pesan terbanyak di platform kami</p>

      <div className="max-w-3xl mx-auto">
        <TopUsersTable users={topUsers || []} />
      </div>
    </div>
  )
}
