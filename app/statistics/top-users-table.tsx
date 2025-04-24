import { Crown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type User = {
  user_id: string
  name: string | null
  username: string | null
  avatar_url: string | null
  total_messages: number
  last_message_at: string
}

interface TopUsersTableProps {
  users: User[]
}

export function TopUsersTable({ users }: TopUsersTableProps) {
  // Fungsi untuk mendapatkan warna background berdasarkan peringkat
  const getRowBackground = (index: number) => {
    switch (index) {
      case 0: // Peringkat 1 - Emas
        return "bg-yellow-50 hover:bg-yellow-100"
      case 1: // Peringkat 2 - Perak
        return "bg-gray-50 hover:bg-gray-100"
      case 2: // Peringkat 3 - Perunggu
        return "bg-amber-50 hover:bg-amber-100"
      default:
        return "hover:bg-gray-50"
    }
  }

  return (
    <div className="border-2 rounded-lg overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow className="border-b-2">
            <TableHead className="w-12 text-center font-bold">Peringkat</TableHead>
            <TableHead className="font-bold">Pengguna</TableHead>
            <TableHead className="text-right font-bold">Jumlah Pesan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => (
            <TableRow
              key={user.user_id}
              className={`${getRowBackground(index)} border-b ${index < 3 ? "font-medium" : ""}`}
            >
              <TableCell className="font-medium text-center">
                {index < 3 ? (
                  <div className="flex justify-center">
                    <Crown
                      className={`h-5 w-5 ${
                        index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-amber-700"
                      }`}
                      fill={index === 0 ? "currentColor" : index === 1 ? "#D1D5DB" : "#B45309"}
                      strokeWidth={1}
                    />
                  </div>
                ) : (
                  index + 1
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar
                    className={`h-10 w-10 border-2 ${
                      index === 0
                        ? "border-yellow-300"
                        : index === 1
                          ? "border-gray-300"
                          : index === 2
                            ? "border-amber-500"
                            : "border-gray-200"
                    }`}
                  >
                    <AvatarImage src={user.avatar_url || undefined} alt={user.name || "User"} />
                    <AvatarFallback
                      className={`
                      ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-800"
                          : index === 1
                            ? "bg-gray-100 text-gray-800"
                            : index === 2
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-800"
                      }
                    `}
                    >
                      {user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="font-medium">{user.name || "Pengguna"}</div>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {index < 3 ? (
                  <span
                    className={`px-2 py-1 rounded-full ${
                      index === 0
                        ? "bg-yellow-100 text-yellow-800"
                        : index === 1
                          ? "bg-gray-100 text-gray-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {user.total_messages}
                  </span>
                ) : (
                  user.total_messages
                )}
              </TableCell>
            </TableRow>
          ))}

          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                Belum ada data statistik
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
