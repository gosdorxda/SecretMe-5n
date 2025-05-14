import UserCleanup from "../components/user-cleanup"
import IPSettings from "../components/ip-settings"

export const dynamic = "force-dynamic"

export default async function SystemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan Sistem</h1>
        <p className="text-muted-foreground">Kelola pengaturan sistem dan pemeliharaan database.</p>
      </div>

      <div className="grid gap-6">
        <UserCleanup />
        <IPSettings />
      </div>
    </div>
  )
}
