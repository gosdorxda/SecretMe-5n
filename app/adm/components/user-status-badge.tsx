import { Badge } from "@/components/ui/badge"

interface UserStatusBadgeProps {
  isActive: boolean
}

export default function UserStatusBadge({ isActive }: UserStatusBadgeProps) {
  if (isActive) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Aktif
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
      Nonaktif
    </Badge>
  )
}
