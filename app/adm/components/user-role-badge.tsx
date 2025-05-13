import { Badge } from "@/components/ui/badge"

interface UserRoleBadgeProps {
  role: string
}

export default function UserRoleBadge({ role }: UserRoleBadgeProps) {
  switch (role) {
    case "admin":
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Admin</Badge>
    case "moderator":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Moderator</Badge>
    default:
      return <Badge variant="outline">Pengguna</Badge>
  }
}
