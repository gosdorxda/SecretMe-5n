import RateLimitConfig from "../components/rate-limit-config"
import BlockedIPs from "../components/blocked-ips"

export const dynamic = "force-dynamic"

export default async function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Keamanan</h1>
        <p className="text-muted-foreground">Kelola pengaturan keamanan platform.</p>
      </div>

      <div className="grid gap-6">
        <RateLimitConfig />
        <BlockedIPs />
      </div>
    </div>
  )
}
