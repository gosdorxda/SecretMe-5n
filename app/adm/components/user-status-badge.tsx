import { Badge } from "@/components/ui/badge"

interface UserStatusBadgeProps {
  isActive: boolean
}

export default function UserStatusBadge({ isActive }: UserStatusBadgeProps) {
  if (isActive) {
    return <Badge className="bg-green-500 hover:bg-green-600">Aktif</Badge>
  }

  return (
    <Badge variant="outline" className="text-red-500 border-red-500">
      Nonaktif
    </Badge>
  )
}
