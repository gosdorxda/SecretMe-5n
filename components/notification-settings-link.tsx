import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"

export function NotificationSettingsLink() {
  return (
    <Button asChild variant="outline" size="sm" className="w-full">
      <Link href="/dashboard/notification-settings" className="flex items-center justify-center gap-2">
        <Bell className="h-4 w-4" />
        <span>Pengaturan Notifikasi</span>
      </Link>
    </Button>
  )
}
