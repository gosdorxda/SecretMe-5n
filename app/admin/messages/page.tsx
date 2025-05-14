import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import { Pagination } from "@/components/pagination"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { page?: string; perPage?: string }
}) {
  const supabase = createClient()

  // Pagination
  const page = Number.parseInt(searchParams.page || "1")
  const perPage = Number.parseInt(searchParams.perPage || "20")
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  // Ambil total jumlah pesan
  const { count, error: countError } = await supabase.from("messages").select("*", { count: "exact", head: true })

  if (countError) {
    console.error("Error fetching message count:", countError)
  }

  // Ambil pesan dengan pagination - perbaikan query
  // Tidak menggunakan join karena ada masalah dengan relasi
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to)

  if (messagesError) {
    console.error("Error fetching messages:", messagesError)
  }

  // Jika berhasil mendapatkan pesan, ambil data pengguna untuk setiap pesan
  let messagesWithUsers = []

  if (messages && messages.length > 0) {
    // Ambil semua user_id unik dari pesan
    const userIds = [...new Set(messages.map((message) => message.user_id))]

    // Ambil data pengguna untuk semua user_id
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, username")
      .in("id", userIds)

    if (usersError) {
      console.error("Error fetching users:", usersError)
    }

    // Gabungkan data pesan dengan data pengguna
    messagesWithUsers = messages.map((message) => {
      const user = users?.find((user) => user.id === message.user_id)
      return {
        ...message,
        user,
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pesan</h1>
        <p className="text-muted-foreground">Semua pesan yang dikirim di platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pesan</CardTitle>
          <CardDescription>
            {count ? `Menampilkan ${from + 1}-${Math.min(to + 1, count)} dari ${count} pesan` : "Memuat data pesan..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messagesError && (
            <div className="bg-red-50 text-red-800 p-4 mb-4 rounded-md">
              <p className="font-medium">Error saat memuat pesan:</p>
              <p className="text-sm">{messagesError.message}</p>
            </div>
          )}

          <div className="space-y-6">
            {messagesWithUsers && messagesWithUsers.length > 0 ? (
              messagesWithUsers.map((message) => (
                <div key={message.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">
                        Kepada: {message.user?.name || "Unknown"}
                        {message.user?.username && (
                          <span className="text-muted-foreground ml-1">@{message.user.username}</span>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: id })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                {messagesError ? "Error saat memuat pesan." : "Tidak ada pesan yang ditemukan."}
              </p>
            )}
          </div>

          {/* Pagination */}
          {count && count > perPage && (
            <div className="mt-6">
              <Pagination currentPage={page} totalPages={Math.ceil(count / perPage)} baseUrl="/admin/messages" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
