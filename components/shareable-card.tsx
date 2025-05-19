"use client"
import { LazyAvatar } from "@/components/lazy-avatar"
import { Crown } from "lucide-react"

interface ShareableCardProps {
  username: string
  displayName: string
  bio: string
  avatarUrl?: string | null
  isPremium?: boolean
  locale?: string // Add locale prop
}

export function ShareableCard({
  username,
  displayName,
  bio,
  avatarUrl,
  isPremium = false,
  locale = "id",
}: ShareableCardProps) {
  return (
    <div className="border-2 border-black rounded-xl overflow-hidden bg-white shadow-neo">
      {/* Header with gradient */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600"></div>

      {/* Content */}
      <div className="px-4 pt-0 pb-4 relative">
        {/* Avatar */}
        <div className="relative -mt-8 mb-3 flex justify-center">
          <div className="h-16 w-16 rounded-full border-2 border-black overflow-hidden bg-white">
            {avatarUrl ? (
              <LazyAvatar
                src={avatarUrl}
                alt={displayName || "User avatar"}
                isPremium={isPremium}
                fallbackText={displayName}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-2xl font-bold text-gray-600">
                {displayName ? displayName.charAt(0).toUpperCase() : "?"}
              </div>
            )}
          </div>

          {/* Premium badge */}
          {isPremium && (
            <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
              <div className="bg-yellow-400 rounded-full p-1 flex items-center justify-center w-6 h-6 border border-black shadow-sm">
                <Crown className="h-3 w-3 text-black" />
              </div>
            </div>
          )}
        </div>

        {/* User info */}
        <div className="text-center mb-3">
          <h3 className="font-bold text-lg">{displayName}</h3>
          <p className="text-gray-600 text-sm">@{username}</p>
        </div>

        {/* Bio */}
        {bio && (
          <div className="text-sm text-center text-gray-700 mb-4 max-h-20 overflow-hidden">
            <p className="line-clamp-3">{bio}</p>
          </div>
        )}

        {/* SecretMe branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-black text-white text-xs font-bold px-2 py-1 rounded">SecretMe</div>
          </div>
          <div className="text-xs text-gray-500">
            {locale === "en" ? "Send anonymous messages" : "Kirim pesan anonim"}
          </div>
        </div>
      </div>
    </div>
  )
}
