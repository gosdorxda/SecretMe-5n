"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Crown, Copy, FileText, Share2 } from "lucide-react"
import { ProfileImageButton } from "@/components/profile-image-button"
import type { Database } from "@/lib/supabase/database.types"
import { useLanguage } from "@/lib/i18n/language-context"

type UserType = Database["public"]["Tables"]["users"]["Row"]

interface ProfileQuickViewProps {
  user: UserType
}

export function ProfileQuickView({ user }: ProfileQuickViewProps) {
  const { toast } = useToast()
  const { locale } = useLanguage()

  // Count active social media links
  const socialMediaCount = [
    user.instagram_url,
    user.facebook_url,
    user.linkedin_url,
    user.twitter_url,
    user.tiktok_url,
  ].filter(Boolean).length

  function copyProfileLink() {
    const profileUrl = `${window.location.origin}${locale === "en" ? "/en" : ""}/${user.is_premium && user.username ? user.username : user.numeric_id}`
    navigator.clipboard.writeText(profileUrl)
    toast({
      title: locale === "en" ? "Link copied" : "Link disalin",
      description:
        locale === "en"
          ? "Your profile link has been copied to clipboard"
          : "Link profil Anda telah disalin ke clipboard",
    })
  }

  return (
    <div className="mb-8">
      <Card className="neo-card overflow-hidden border-2 border-[var(--border)]">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Profile Info */}
            <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-gray-200">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24 border-2 border-[var(--border)]">
                  {user.avatar_url ? (
                    <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.name} />
                  ) : (
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-5xl font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{user.name}</h2>
                    {user.is_premium && (
                      <Badge className="bg-[rgb(250,204,21)] text-black border border-amber-500 rounded-[var(--border-radius)] text-[10px] font-normal">
                        <Crown className="h-2.5 w-2.5 mr-1" />
                        <span>Premium</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{user.username || user.numeric_id}</p>
                  {!user.is_premium && (
                    <p className="text-xs text-amber-500 italic mt-1">
                      {locale === "en"
                        ? "Upgrade to Premium to change username"
                        : "Upgrade ke Premium untuk ganti username"}
                    </p>
                  )}

                  {/* Bio section - show for premium users or locked for free users */}
                  {user.is_premium && user.bio ? (
                    <p className="text-sm mt-2 line-clamp-2">{user.bio}</p>
                  ) : (
                    <div className="mt-2 flex items-center gap-1.5 text-muted-foreground/70">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <p className="text-xs italic line-clamp-1">
                        {user.is_premium
                          ? locale === "en"
                            ? "Add your bio..."
                            : "Tambahkan bio Anda..."
                          : locale === "en"
                            ? "Bio (premium feature)"
                            : "Bio (fitur premium)"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Media Links */}
              <div className="mt-4 flex gap-2">
                {user.is_premium && socialMediaCount > 0 ? (
                  <>
                    {user.instagram_url && (
                      <a
                        href={user.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full p-1.5 bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-colors"
                        title="Instagram"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                    )}
                    {user.facebook_url && (
                      <a
                        href={user.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full p-1.5 bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-colors"
                        title="Facebook"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                        </svg>
                      </a>
                    )}
                    {user.linkedin_url && (
                      <a
                        href={user.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full p-1.5 bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-colors"
                        title="LinkedIn"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                        </svg>
                      </a>
                    )}
                    {user.tiktok_url && (
                      <a
                        href={user.tiktok_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full p-1.5 bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-colors"
                        title="TikTok"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                        </svg>
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <div className="rounded-full p-1.5 bg-gray-100 text-gray-400 border border-gray-300 opacity-50">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </div>
                    <div className="rounded-full p-1.5 bg-gray-100 text-gray-400 border border-gray-300 opacity-50">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                      </svg>
                    </div>
                    <div className="rounded-full p-1.5 bg-gray-100 text-gray-400 border border-gray-300 opacity-50">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                      </svg>
                    </div>
                    {!user.is_premium && (
                      <div className="flex items-center ml-1">
                        <span className="text-xs text-muted-foreground italic">
                          {locale === "en" ? "(Premium feature)" : "(Fitur premium)"}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Share Profile */}
            <div className="bg-gradient-to-br from-[var(--bg)] to-gray-100 md:w-1/3">
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2 p-4 pb-0">
                <Share2 className="h-4 w-4 text-gray-600" />
                <span>{locale === "en" ? "Share Your Profile" : "Bagikan Profil Anda"}</span>
              </h3>

              <div className="bg-white p-2 rounded-md border border-[var(--border)] mb-3 mx-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">{locale === "en" ? "Link:" : "Link:"}</span>
                  <code className="bg-gray-50 px-2 py-0.5 rounded text-xs flex-1 truncate border border-gray-100">
                    {window.location.origin}
                    {locale === "en" ? "/en" : ""}/{user.is_premium && user.username ? user.username : user.numeric_id}
                  </code>
                </div>
              </div>

              <div className="flex gap-2 mx-4 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyProfileLink}
                  className="flex-1 neo-btn-outline text-xs h-9"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  {locale === "en" ? "Copy Link" : "Salin Link"}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 neo-btn text-xs h-9"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: locale === "en" ? "Send me an anonymous message" : "Kirim pesan anonim ke saya",
                        text:
                          locale === "en"
                            ? "Send me an anonymous message via SecretMe"
                            : "Kirim pesan anonim ke saya melalui SecretMe",
                        url: `${window.location.origin}${locale === "en" ? "/en" : ""}/${
                          user.is_premium && user.username ? user.username : user.numeric_id
                        }`,
                      })
                    } else {
                      copyProfileLink()
                    }
                  }}
                >
                  <Share2 className="h-3.5 w-3.5 mr-1.5" />
                  {locale === "en" ? "Share" : "Bagikan"}
                </Button>
              </div>

              <div className="mx-4 mb-4">
                <ProfileImageButton
                  username={user.is_premium && user.username ? user.username : user.numeric_id}
                  displayName={user.name}
                  bio={user.bio}
                  avatarUrl={user.avatar_url}
                  isPremium={user.is_premium}
                  variant="blue"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-9 bg-blue-500 text-white border-2 border-blue-600 hover:bg-blue-600 hover:border-blue-700 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    {locale === "en" ? "Share Profile Card" : "Bagikan Kartu Profil"}
                  </Button>
                </ProfileImageButton>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
