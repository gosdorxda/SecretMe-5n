import { Badge } from "@/components/ui/badge"

interface UserRoleBadgeProps {
  role: string
}

export default function UserRoleBadge({ role }: UserRoleBadgeProps) {
  switch (role) {
    case "admin":
      return <Badge className="bg-purple-600 hover:bg-purple-700">Admin</Badge>
    case "moderator":
      return <Badge className="bg-blue-600 hover:bg-blue-700">Moderator</Badge>
    default:
      return <Badge variant="outline">Pengguna</Badge>
  }
}
