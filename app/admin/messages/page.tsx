import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import { Pagination } from "@/components/pagination"

export const dynamic = "force-dynamic"

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
  const { count } = await supabase.from("messages").select("*", { count: "exact", head: true })

  // Ambil pesan dengan pagination
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      id, 
      content, 
      created_at,
      users!recipient_id (
        id,
        name,
        username
      )
    `)
    .order("created_at", { ascending: false })
    .range(from, to)

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
            Menampilkan {from + 1}-{Math.min(to + 1, count || 0)} dari {count || 0} pesan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {messages && messages.length > 0 ? (
              messages.map((message) => (
                <div key={message.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">
                        Kepada: {message.users?.name || "Unknown"}
                        {message.users?.username && (
                          <span className="text-muted-foreground ml-1">@{message.users.username}</span>
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
              <p className="text-center text-muted-foreground py-4">Tidak ada pesan yang ditemukan.</p>
            )}
          </div>

          {/* Pagination */}
          {count && count > perPage && (
            <div className="mt-6">
              <Pagination currentPage={page} totalPages={Math.ceil((count || 0) / perPage)} baseUrl="/admin/messages" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
