import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import AdminDashboard from "./admin-dashboard"

export default async function AdminPage() {
  const supabase = createServerComponentClient({ cookies })

  // Verifikasi apakah pengguna adalah admin
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Ambil data pengguna
  const { data: userData, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

  if (error) {
    console.error("Error fetching user data:", error)
    redirect("/")
  }

  // Periksa apakah pengguna memiliki role admin
  if (!userData || userData.role !== "admin") {
    redirect("/")
  }

  return <AdminDashboard userId={session.user.id} />
}
