import { createClient } from "@/lib/supabase/server"
import UsersManagement from "../components/users-management"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const supabase = createClient()

  // Ambil data pengguna dengan pagination
  const { data: users } = await supabase.from("users").select("*").order("created_at", { ascending: false }).limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
        <p className="text-muted-foreground">Kelola semua pengguna yang terdaftar di platform.</p>
      </div>

      <UsersManagement initialUsers={users || []} />
    </div>
  )
}
