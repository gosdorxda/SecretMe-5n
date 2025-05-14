import { createClient } from "@/lib/supabase/server"
import UsersManagement from "../components/users-management"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const supabase = createClient()

  // Kita hanya mengambil total count untuk pagination
  const { count } = await supabase.from("users").select("*", { count: "exact", head: true })

  // Ambil data pengguna awal (halaman pertama)
  const { data: initialUsers } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .range(0, 19) // 20 pengguna per halaman

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
        <p className="text-muted-foreground">Kelola semua pengguna yang terdaftar di platform.</p>
      </div>

      <UsersManagement initialUsers={initialUsers || []} totalUsers={count || 0} />
    </div>
  )
}
