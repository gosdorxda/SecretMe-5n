"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Crown, User, FileText, Link2, CheckCircle, Lock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ProfilePreview } from "@/components/profile-preview"
import { UsernameForm } from "@/components/username-form"
import { NameForm } from "@/components/name-form"
import { BioForm } from "@/components/bio-form"
import { SocialMediaForm } from "@/components/social-media-form"
import { AvatarUpload } from "@/components/avatar-upload"
import { TelegramForm } from "@/components/telegram-form"
import type { Database } from "@/lib/supabase/database.types"

type UserType = Database["public"]["Tables"]["users"]["Row"]

interface ProfileTabProps {
  user: UserType
}

export function ProfileTab({ user }: ProfileTabProps) {
  // Count active social media links
  const socialMediaCount = [
    user.instagram_url,
    user.facebook_url,
    user.linkedin_url,
    user.twitter_url,
    user.tiktok_url,
  ].filter(Boolean).length

  return (
    <Card className="neo-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg">Profil</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="mb-8">
          <ProfilePreview user={user} />
        </div>

        {user.is_premium ? (
          <div className="space-y-4">
            {/* Foto Profil Section */}
            <div className="relative rounded-lg border-2 border-amber-200 p-4 overflow-hidden text-left bg-gradient-to-br from-amber-50/40 to-amber-100/30">
              {/* Premium badge */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[rgb(250,204,21)] text-black text-[10px] px-2 py-0.5 rounded-[var(--border-radius)] flex items-center gap-1 border border-black">
                <Crown className="h-2.5 w-2.5" />
                <span>Premium</span>
              </div>

              {/* Decorative elements */}
              <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-amber-500/10"></div>
              <div className="absolute -left-6 -bottom-6 w-16 h-16 rounded-full bg-orange-500/10"></div>

              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2 text-gray-800">
                <div className="flex items-center justify-center bg-amber-100 text-amber-600 p-1.5 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="10" r="3" />
                    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                  </svg>
                </div>
                <span>Foto Profil</span>
              </h3>

              <div className="flex flex-col md:flex-row gap-4 sm:gap-5 items-center md:items-start">
                <div className="relative h-28 w-28 sm:h-36 sm:w-36 overflow-hidden rounded-lg border-2 border-amber-200 flex-shrink-0 bg-white">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url || "/placeholder.svg"}
                      alt={user.name}
                      className="h-full w-full object-cover"
                      width={144}
                      height={144}
                      priority
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-amber-50">
                      <User className="h-12 w-12 sm:h-16 sm:w-16 text-amber-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full">
                  <AvatarUpload userId={user.id} avatarUrl={user.avatar_url} />
                </div>
              </div>
            </div>

            {/* Username Section */}
            <div className="relative rounded-lg border border-blue-200 p-4 overflow-hidden text-left bg-gradient-to-br from-blue-50/40 to-blue-100/30">
              {/* Premium badge */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[rgb(250,204,21)] text-black text-[10px] px-2 py-0.5 rounded-[var(--border-radius)] flex items-center gap-1 shadow-sm border border-black">
                <Crown className="h-2.5 w-2.5" />
                <span>Premium</span>
              </div>

              {/* Decorative elements */}
              <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-blue-500/10"></div>
              <div className="absolute -left-6 -bottom-6 w-16 h-16 rounded-full bg-indigo-500/10"></div>

              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2 text-gray-800">
                <div className="flex items-center justify-center bg-blue-100 text-blue-600 p-1.5 rounded-lg shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span>Username Kustom</span>
              </h3>

              <div className="mb-4 p-2 sm:p-3 bg-white/50 rounded-lg border border-blue-100">
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Username saat ini:</span>
                    <span className="text-sm font-medium text-blue-700 break-all">
                      {user.username || "Belum diatur"}
                    </span>
                  </div>
                  <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs mt-1 xs:mt-0 self-start xs:self-auto">
                    {user.username ? "Aktif" : "Belum diatur"}
                  </div>
                </div>
              </div>

              <UsernameForm userId={user.id} currentUsername={user.username} />
            </div>

            {/* Name Section */}
            <div className="relative rounded-lg border border-red-200 p-4 overflow-hidden text-left bg-gradient-to-br from-red-50/40 to-red-100/30">
              {/* Premium badge */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[rgb(250,204,21)] text-black text-[10px] px-2 py-0.5 rounded-[var(--border-radius)] flex items-center gap-1 shadow-sm border border-black">
                <Crown className="h-2.5 w-2.5" />
                <span>Premium</span>
              </div>

              {/* Decorative elements */}
              <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-red-500/10"></div>
              <div className="absolute -left-6 -bottom-6 w-16 h-16 rounded-full bg-orange-500/10"></div>

              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2 text-gray-800">
                <div className="flex items-center justify-center bg-red-100 text-red-600 p-1.5 rounded-lg shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <span>Ubah Nama</span>
              </h3>

              <div className="mb-4 p-2 sm:p-3 bg-white/50 rounded-lg border border-red-100">
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Nama saat ini:</span>
                    <span className="text-sm font-medium text-red-700 break-all">{user.name}</span>
                  </div>
                  <div className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs mt-1 xs:mt-0 self-start xs:self-auto">
                    Aktif
                  </div>
                </div>
              </div>

              <NameForm userId={user.id} currentName={user.name} />
            </div>

            {/* Bio Section */}
            <div className="relative rounded-lg border border-green-200 p-4 overflow-hidden text-left bg-gradient-to-br from-green-50/40 to-green-100/30">
              {/* Premium badge */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[rgb(250,204,21)] text-black text-[10px] px-2 py-0.5 rounded-[var(--border-radius)] flex items-center gap-1 shadow-sm border border-black">
                <Crown className="h-2.5 w-2.5" />
                <span>Premium</span>
              </div>

              {/* Decorative elements */}
              <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-green-500/10"></div>
              <div className="absolute -left-6 -bottom-6 w-16 h-16 rounded-full bg-teal-500/10"></div>

              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2 text-gray-800">
                <div className="flex items-center justify-center bg-green-100 text-green-600 p-1.5 rounded-lg shadow-sm">
                  <FileText className="h-4 w-4" />
                </div>
                <span>Bio / Deskripsi Singkat</span>
              </h3>

              <div className="mb-4 p-3 bg-white/50 rounded-lg border border-green-100">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Bio saat ini:</span>
                    <span className="text-sm text-green-700 line-clamp-2">{user.bio || "Belum ada deskripsi"}</span>
                  </div>
                  <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                    {user.bio ? "Terisi" : "Kosong"}
                  </div>
                </div>
              </div>

              <BioForm userId={user.id} currentBio={user.bio} />
            </div>

            {/* Social Media Section */}
            <div className="relative rounded-lg border border-purple-200 p-4 overflow-hidden text-left bg-gradient-to-br from-purple-50/40 to-purple-100/30">
              {/* Premium badge */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[rgb(250,204,21)] text-black text-[10px] px-2 py-0.5 rounded-[var(--border-radius)] flex items-center gap-1 shadow-sm border border-black">
                <Crown className="h-2.5 w-2.5" />
                <span>Premium</span>
              </div>

              {/* Decorative elements */}
              <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-purple-500/10"></div>
              <div className="absolute -left-6 -bottom-6 w-16 h-16 rounded-full bg-pink-500/10"></div>

              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2 text-gray-800">
                <div className="flex items-center justify-center bg-purple-100 text-purple-600 p-1.5 rounded-lg shadow-sm">
                  <Link2 className="h-4 w-4" />
                </div>
                <span>Link Sosial Media</span>
              </h3>

              <div className="mb-4 p-2 sm:p-3 bg-white/50 rounded-lg border border-purple-100">
                <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Status sosial media:</span>
                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                      {user.instagram_url && (
                        <div className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded-[var(--border-radius)] text-xs flex items-center gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                          <span>Instagram</span>
                        </div>
                      )}
                      {user.facebook_url && (
                        <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-[var(--border-radius)] text-xs flex items-center gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                          </svg>
                          <span>Facebook</span>
                        </div>
                      )}
                      {user.linkedin_url && (
                        <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-[var(--border-radius)] text-xs flex items-center gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                          </svg>
                          <span>LinkedIn</span>
                        </div>
                      )}
                      {user.tiktok_url && (
                        <div className="px-2 py-0.5 bg-black bg-opacity-10 text-black rounded-[var(--border-radius)] text-xs flex items-center gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                          </svg>
                          <span>TikTok</span>
                        </div>
                      )}
                      {socialMediaCount === 0 && (
                        <span className="text-sm text-purple-700">Belum ada sosial media</span>
                      )}
                    </div>
                  </div>
                  <div className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs self-start">
                    {socialMediaCount > 0 ? `${socialMediaCount} Aktif` : "Kosong"}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Tambahkan link sosial media Anda untuk ditampilkan di profil publik
              </p>
              <SocialMediaForm
                userId={user.id}
                instagramUrl={user.instagram_url}
                facebookUrl={user.facebook_url}
                linkedinUrl={user.linkedin_url}
                tiktokUrl={user.tiktok_url}
              />
            </div>

            {/* Notification Settings Section */}
            <div className="space-y-6 mt-8">
              {/* Telegram Notification Card */}
              <div className="relative rounded-lg border border-blue-200 p-4 overflow-hidden text-left bg-gradient-to-br from-blue-50/40 to-blue-100/30">
                {/* Premium badge */}
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[rgb(250,204,21)] text-black text-[10px] px-2 py-0.5 rounded-[var(--border-radius)] flex items-center gap-1 shadow-sm border border-black">
                  <Crown className="h-2.5 w-2.5" />
                  <span>Premium</span>
                </div>

                {/* Decorative elements */}
                <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-blue-500/10"></div>
                <div className="absolute -left-6 -bottom-6 w-16 h-16 rounded-full bg-indigo-500/10"></div>

                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2 text-gray-800">
                  <div className="flex items-center justify-center bg-blue-100 text-blue-600 p-1.5 rounded-lg shadow-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <span>Notifikasi Telegram</span>
                </h3>

                <div className="mb-4 p-3 bg-white/50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">Status:</span>
                      <span className="text-sm text-blue-700">
                        {user.telegram_id ? (user.telegram_notifications ? "Aktif" : "Nonaktif") : "Belum diatur"}
                      </span>
                    </div>
                    <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {user.telegram_id ? (user.telegram_notifications ? "Aktif" : "Nonaktif") : "Belum diatur"}
                    </div>
                  </div>
                </div>

                <TelegramForm
                  userId={user.id}
                  initialTelegramId={user.telegram_id}
                  initialTelegramNotifications={user.telegram_notifications || false}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Locked premium features for free users */}
            <div className="relative rounded-lg border-2 border-gray-200 p-4 overflow-hidden text-left bg-gray-50/50">
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="bg-white p-4 rounded-lg border-2 border-amber-200 shadow-lg text-center max-w-xs">
                  <Lock className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                  <h3 className="font-bold text-lg mb-1">Fitur Premium</h3>
                  <p className="text-sm text-gray-600 mb-3">Upgrade ke premium untuk mengakses semua fitur profil</p>
                  <Button asChild className="neo-btn w-full">
                    <Link href="/premium">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade Sekarang
                    </Link>
                  </Button>
                </div>
              </div>

              <h3 className="font-semibold mb-3 text-sm sm:text-base flex items-center gap-2 text-gray-800">
                <div className="flex items-center justify-center bg-amber-100 text-amber-600 p-1.5 rounded-lg">
                  <User className="h-4 w-4" />
                </div>
                <span>Foto Profil</span>
              </h3>
              <div className="h-32 w-full bg-gray-100 rounded-lg border border-gray-200 mb-4"></div>

              <h3 className="font-semibold mb-3 text-sm sm:text-base flex items-center gap-2 text-gray-800">
                <div className="flex items-center justify-center bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                  <User className="h-4 w-4" />
                </div>
                <span>Username Kustom</span>
              </h3>
              <div className="h-24 w-full bg-gray-100 rounded-lg border border-gray-200 mb-4"></div>

              <h3 className="font-semibold mb-3 text-sm sm:text-base flex items-center gap-2 text-gray-800">
                <div className="flex items-center justify-center bg-green-100 text-green-600 p-1.5 rounded-lg">
                  <FileText className="h-4 w-4" />
                </div>
                <span>Bio / Deskripsi Singkat</span>
              </h3>
              <div className="h-24 w-full bg-gray-100 rounded-lg border border-gray-200"></div>
            </div>

            {/* Premium CTA with detailed benefits */}
            <div className="bg-[rgb(250,204,21)]/10 p-6 rounded-lg border-2 border-[rgb(250,204,21)] mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-[var(--main)] border-2 border-black flex items-center justify-center">
                  <Crown className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Upgrade ke Premium</h3>
                  <p className="text-sm text-gray-600">Akses semua fitur premium dengan sekali bayar</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Username Kustom</p>
                    <p className="text-sm text-gray-600">Pilih username unik untuk link profil Anda</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Foto Profil</p>
                    <p className="text-sm text-gray-600">Unggah foto profil Anda sendiri</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Bio Profil</p>
                    <p className="text-sm text-gray-600">Tambahkan deskripsi singkat tentang diri Anda</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Link Sosial Media</p>
                    <p className="text-sm text-gray-600">Tambahkan link Instagram, Facebook, LinkedIn, dan TikTok</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Hapus Pesan</p>
                    <p className="text-sm text-gray-600">Hapus pesan yang tidak diinginkan</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Balasan Publik</p>
                    <p className="text-sm text-gray-600">Aktifkan balasan publik untuk pesan Anda</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Akses Selamanya</p>
                    <p className="text-sm text-gray-600">Bayar sekali, akses premium selamanya</p>
                  </div>
                </div>
              </div>

              <Button asChild className="neo-btn w-full">
                <Link href="/premium">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Sekarang
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
