"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { TemplateShareButton } from "@/components/template-share-button"

interface MessageCardProps {
  id: string
  message: string
  createdAt: Date | string
  username: string
  avatarUrl?: string | null
}

export function MessageCardWithTemplateShare({ id, message, createdAt, username, avatarUrl }: MessageCardProps) {
  // Format date for display
  const formattedDate = typeof createdAt === "string" ? createdAt : formatDate(createdAt)

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <p className="mb-2 text-sm text-gray-500">{formattedDate}</p>
        <p className="whitespace-pre-wrap">{message}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <TemplateShareButton username={username} message={message} date={createdAt} avatarUrl={avatarUrl} />
      </CardFooter>
    </Card>
  )
}
