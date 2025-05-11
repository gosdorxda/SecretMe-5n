"use client"

import { Card } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"
import type { Database } from "@/lib/supabase/database.types"

type Message = Database["public"]["Tables"]["messages"]["Row"]

interface StatisticsCardsProps {
  messages: Message[]
  viewCount: number
}

export function StatisticsCards({ messages, viewCount }: StatisticsCardsProps) {
  // Calculate stats
  const totalMessages = messages.length
  const repliedMessages = messages.filter((m) => m.reply).length
  const unrepliedMessages = totalMessages - repliedMessages

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="neo-card border-2 border-[var(--border)] py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pesan</p>
              <p className="text-xl font-bold">{totalMessages}</p>
            </div>
          </div>
        </Card>

        <Card className="neo-card border-2 border-[var(--border)] py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dibalas</p>
              <p className="text-xl font-bold">{repliedMessages}</p>
            </div>
          </div>
        </Card>

        <Card className="neo-card border-2 border-[var(--border)] py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
              <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Belum Dibalas</p>
              <p className="text-xl font-bold">{unrepliedMessages}</p>
            </div>
          </div>
        </Card>

        <Card className="neo-card border-2 border-[var(--border)] py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tayangan</p>
              <p className="text-xl font-bold">{viewCount}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
