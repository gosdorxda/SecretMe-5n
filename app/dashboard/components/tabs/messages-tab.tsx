"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"
import { MessageList } from "@/components/message-list"
import { PublicRepliesToggle } from "@/components/public-replies-toggle"
import { FilterButton } from "@/components/ui/filter-button"
import { ShareProfileButton } from "@/components/share-profile-button"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { motion } from "framer-motion"
import type { Database } from "@/lib/supabase/database.types"

type UserType = Database["public"]["Tables"]["users"]["Row"]
type Message = Database["public"]["Tables"]["messages"]["Row"]

interface MessagesTabProps {
  user: UserType
  messages: Message[]
  onCopyProfileLink: () => void
}

export function MessagesTab({ user, messages, onCopyProfileLink }: MessagesTabProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "replied" | "unreplied">("all")
  const [allowPublicReplies, setAllowPublicReplies] = useState(user.allow_public_replies || false)
  const [searchFocused, setSearchFocused] = useState(false)

  // Filter messages based on search and filter status
  const filteredMessages = messages.filter((message) => {
    const matchesSearch = message.content.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterStatus === "all") return matchesSearch
    if (filterStatus === "replied") return matchesSearch && !!message.reply
    if (filterStatus === "unreplied") return matchesSearch && !message.reply

    return matchesSearch
  })

  function handleReplySuccess() {
    router.refresh()
  }

  function handleDeleteSuccess() {
    router.refresh()
  }

  const profileUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${
    user.is_premium && user.username ? user.username : user.numeric_id
  }`

  return (
    <Card className="neo-card">
      <CardHeader className="pb-0 pt-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Pesan Anonim</CardTitle>
            <AnimatedCounter
              value={messages.length}
              className="text-sm bg-gray-100 px-2 py-0.5 rounded-full text-gray-700"
            />
          </div>
        </div>

        <motion.div
          className="mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between bg-orange-50/80 rounded-lg p-3 border border-orange-200">
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-orange-700">Balasan Publik</span>
                  <Badge
                    variant={allowPublicReplies ? "success" : "secondary"}
                    className={
                      allowPublicReplies
                        ? "bg-green-100 text-green-800 border-green-200 text-xs px-1.5 py-0"
                        : "bg-gray-100 text-gray-800 border-gray-200 text-xs px-1.5 py-0"
                    }
                  >
                    {allowPublicReplies ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
                <p className="text-xs text-orange-600">
                  {allowPublicReplies ? "Pengunjung dapat membalas pesan Anda" : "Hanya Anda yang dapat membalas pesan"}
                </p>
              </div>
            </div>
            <PublicRepliesToggle
              userId={user.id}
              initialValue={allowPublicReplies}
              minimal={true}
              onToggleChange={(checked) => setAllowPublicReplies(checked)}
            />
          </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <motion.div
            className="relative flex-1"
            animate={{ scale: searchFocused ? 1.02 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              placeholder="Cari pesan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="pl-10 border-2 border-gray-200 h-10 text-sm transition-all duration-200"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchTerm("")}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
          </motion.div>

          <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
            <FilterButton
              isActive={filterStatus === "all"}
              onClick={() => setFilterStatus("all")}
              className="h-10 px-3 text-xs flex-1 sm:flex-none"
            >
              Semua
            </FilterButton>
            <FilterButton
              isActive={filterStatus === "replied"}
              onClick={() => setFilterStatus("replied")}
              className="h-10 px-3 text-xs flex-1 sm:flex-none"
            >
              Dibalas
            </FilterButton>
            <FilterButton
              isActive={filterStatus === "unreplied"}
              onClick={() => setFilterStatus("unreplied")}
              className="h-10 px-3 text-xs flex-1 sm:flex-none"
            >
              Belum Dibalas
            </FilterButton>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {filteredMessages.length === 0 && searchTerm && (
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1">Tidak ada hasil</p>
            <p className="text-sm text-gray-400">Tidak ada pesan yang cocok dengan pencarian "{searchTerm}"</p>
          </motion.div>
        )}

        {filteredMessages.length === 0 && !searchTerm && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-blue-300" />
            </div>
            <h3 className="text-lg font-medium mb-2">Belum ada pesan</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Bagikan link profil Anda untuk mulai menerima pesan anonim dari teman dan pengikut Anda.
            </p>
            <ShareProfileButton
              url={profileUrl}
              variant="default"
              size="sm"
              className="neo-btn"
              onCopyFallback={onCopyProfileLink}
            />
          </motion.div>
        )}

        {filteredMessages.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <MessageList
              messages={filteredMessages}
              hideReadStatus={true}
              isPremium={user.is_premium}
              onReplySuccess={handleReplySuccess}
              onDeleteSuccess={handleDeleteSuccess}
              enablePublicReplies={true}
              username={user.username}
              numericId={user.numeric_id}
              enableSharing={true}
              displayName={user.name}
            />
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
