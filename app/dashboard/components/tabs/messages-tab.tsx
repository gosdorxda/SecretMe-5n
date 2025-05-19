"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Share2 } from "lucide-react"
import { MessageList } from "@/components/message-list"
import { PublicRepliesToggle } from "@/components/public-replies-toggle"
import { useLanguage } from "@/lib/i18n/language-context"
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
  const { t, locale } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "replied" | "unreplied">("all")
  const [allowPublicReplies, setAllowPublicReplies] = useState(user.allow_public_replies || false)

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

  function handleShareProfile() {
    if (navigator.share) {
      navigator.share({
        title: locale === "en" ? "Send me anonymous messages" : "Kirim pesan anonim ke saya",
        text:
          locale === "en" ? "Send me anonymous messages via SecretMe" : "Kirim pesan anonim ke saya melalui SecretMe",
        url: `${window.location.origin}/${user.is_premium && user.username ? user.username : user.numeric_id}`,
      })
    } else {
      onCopyProfileLink()
    }
  }

  return (
    <Card className="neo-card">
      <CardHeader className="pb-0 pt-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{t.dashboard.messagesTab.title}</CardTitle>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between bg-orange-50/80 rounded-lg p-3 border border-orange-200">
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-orange-700">
                    {t.dashboard.messagesTab.publicReplies.title}
                  </span>
                  <Badge
                    variant={allowPublicReplies ? "success" : "secondary"}
                    className={
                      allowPublicReplies
                        ? "bg-green-100 text-green-800 border-green-200 text-xs px-1.5 py-0"
                        : "bg-gray-100 text-gray-800 border-gray-200 text-xs px-1.5 py-0"
                    }
                  >
                    {allowPublicReplies
                      ? t.dashboard.messagesTab.publicReplies.active
                      : t.dashboard.messagesTab.publicReplies.inactive}
                  </Badge>
                </div>
                <p className="text-xs text-orange-600">
                  {allowPublicReplies
                    ? t.dashboard.messagesTab.publicReplies.activeDescription
                    : t.dashboard.messagesTab.publicReplies.inactiveDescription}
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
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="relative flex-1">
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
              placeholder={t.dashboard.messagesTab.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 border-gray-200 h-10 text-sm"
            />
          </div>

          <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
              className={`h-10 px-3 text-xs flex-1 sm:flex-none !transition-none !transform-none ${
                filterStatus === "all"
                  ? "bg-[var(--main)] text-white border-2 border-black shadow-none hover:bg-[var(--main)] hover:text-white hover:shadow-none active:shadow-none focus:shadow-none focus:outline-none focus-visible:ring-0 focus:ring-0 focus:scale-100 active:scale-100"
                  : "bg-white text-gray-700 border-2 border-black shadow-none hover:bg-white hover:text-gray-700 hover:shadow-none active:shadow-none focus:shadow-none focus:outline-none focus-visible:ring-0 focus:ring-0 focus:scale-100 active:scale-100"
              }`}
            >
              {t.dashboard.messagesTab.filters.all}
            </Button>
            <Button
              variant={filterStatus === "replied" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("replied")}
              className={`h-10 px-3 text-xs flex-1 sm:flex-none !transition-none !transform-none ${
                filterStatus === "replied"
                  ? "bg-[var(--main)] text-white border-2 border-black shadow-none hover:bg-[var(--main)] hover:text-white hover:shadow-none active:shadow-none focus:shadow-none focus:outline-none focus-visible:ring-0 focus:ring-0 focus:scale-100 active:scale-100"
                  : "bg-white text-gray-700 border-2 border-black shadow-none hover:bg-white hover:text-gray-700 hover:shadow-none active:shadow-none focus:shadow-none focus:outline-none focus-visible:ring-0 focus:ring-0 focus:scale-100 active:scale-100"
              }`}
            >
              {t.dashboard.messagesTab.filters.replied}
            </Button>
            <Button
              variant={filterStatus === "unreplied" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("unreplied")}
              className={`h-10 px-3 text-xs flex-1 sm:flex-none !transition-none !transform-none ${
                filterStatus === "unreplied"
                  ? "bg-[var(--main)] text-white border-2 border-black shadow-none hover:bg-[var(--main)] hover:text-white hover:shadow-none active:shadow-none focus:shadow-none focus:outline-none focus-visible:ring-0 focus:ring-0 focus:scale-100 active:scale-100"
                  : "bg-white text-gray-700 border-2 border-black shadow-none hover:bg-white hover:text-gray-700 hover:shadow-none active:shadow-none focus:shadow-none focus:outline-none focus-visible:ring-0 focus:ring-0 focus:scale-100 active:scale-100"
              }`}
            >
              {t.dashboard.messagesTab.filters.unreplied}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {filteredMessages.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1">{t.dashboard.messagesTab.noResults.title}</p>
            <p className="text-sm text-gray-400">
              {t.dashboard.messagesTab.noResults.description} "{searchTerm}"
            </p>
          </div>
        )}

        {filteredMessages.length === 0 && !searchTerm && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-blue-300" />
            </div>
            <h3 className="text-lg font-medium mb-2">{t.dashboard.messagesTab.noMessages.title}</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">{t.dashboard.messagesTab.noMessages.description}</p>
            <Button variant="default" size="sm" className="neo-btn" onClick={handleShareProfile}>
              <Share2 className="h-4 w-4 mr-2" />
              {t.dashboard.messagesTab.noMessages.shareButton}
            </Button>
          </div>
        )}

        {filteredMessages.length > 0 && (
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
        )}
      </CardContent>
    </Card>
  )
}
