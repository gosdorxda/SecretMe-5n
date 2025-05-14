import NotificationSettings from "../components/notification-settings"
import NotificationLogs from "../components/notification-logs"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifikasi</h1>
        <p className="text-muted-foreground">Kelola notifikasi sistem dan lihat log pengiriman.</p>
      </div>

      <div className="grid gap-6">
        <NotificationSettings />
        <NotificationLogs />
      </div>
    </div>
  )
}
