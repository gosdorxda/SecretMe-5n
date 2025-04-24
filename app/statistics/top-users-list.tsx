import Link from "next/link"
import { Crown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type User = {
  user_id: string
  name: string | null
  username: string | null
  avatar_url: string | null
  total_messages: number
  last_message_at: string
}

interface TopUsersListProps {
  users: User[]
}

export function TopUsersList({ users }: TopUsersListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user, index) => (
        <Link href={`/${user.username}`} key={user.user_id}>
          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-gray-200">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.name || "User"} />
                    <AvatarFallback>{user.name?.charAt(0) || user.username?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {index < 3 && (
                        <Crown
                          className={`h-5 w-5 ${
                            index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-amber-700"
                          }`}
                          fill={index === 0 ? "currentColor" : "none"}
                        />
                      )}
                      {user.name || "Pengguna"}
                    </h3>
                    <p className="text-gray-500">@{user.username || "anonymous"}</p>
                  </div>
                </div>
                <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
                  {user.total_messages} pesan
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">Peringkat #{index + 1}</div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
