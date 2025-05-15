// Tambahkan ini di bagian atas file
export const dynamic = "force-dynamic"

import { notFound, redirect } from "next/navigation"
import { createClient, getVerifiedUser } from "@/lib/supabase/server"
import { SendMessageForm } from "./send-message-form"
import { MessageList } from "@/components/message-list"
import { Crown, Info } from "lucide-react"
import { ProfileCta } from "@/components/profile-cta"
import { ProfileSeo } from "@/components/profile-seo"
import { ProfileSchema } from "@/components/profile-schema"
import { CustomSocialIcons } from "@/components/custom-social-icons"
import { ProfileImageButton } from "@/components/profile-image-button"
import { TruncatedBio } from "@/components/truncated-bio"
import { PremiumFeatureTeaser } from "@/components/premium-feature-teaser"
import { LazyAvatar } from "@/components/lazy-avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Modifikasi metadata statis untuk SEO dasar
export const metadata = {
  title: "Profil Pengguna | SecretMe",
  description: "Kirim pesan anonim melalui SecretMe",
}

// Daftar username demo yang tidak bisa menerima pesan
const DEMO_USERNAMES = ["anitawijaya"]

export default async function ProfilePage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const supabase = createClient()

  // Gunakan getVerifiedUser untuk mendapatkan user yang terverifikasi
  const { user: authUser } = await getVerifiedUser()
  const userId = authUser?.id || null

  let user = null

  // Check if the slug is a number (numeric ID)
  const numericId = Number.parseInt(slug, 10)
  if (!isNaN(numericId)) {
    // It's a numeric ID, find the user by numeric_id
    const { data: userByNumericId } = await supabase
      .from("users")
      .select(
        "id, name, username, is_premium, instagram_url, facebook_url, linkedin_url, tiktok_url, avatar_url, bio, numeric_id, created_at",
      )
      .eq("numeric_id", numericId)
      .single()

    // Perbaikan: Hapus kondisi tambahan, semua pengguna dengan numeric_id valid dapat diakses
    if (userByNumericId) {
      // If the user is premium and has a username, redirect to the username URL
      if (userByNumericId.is_premium && userByNumericId.username) {
        return redirect(`/${userByNumericId.username}`)
      }

      user = userByNumericId
    }
  } else {
    // It's a username, find the user by username
    const { data: userByUsername } = await supabase
      .from("users")
      .select(
        "id, name, username, is_premium, instagram_url, facebook_url, linkedin_url, tiktok_url, avatar_url, bio, numeric_id, created_at",
      )
      .eq("username", slug)
      .single()

    // Hanya pengguna premium yang dapat mengatur username
    if (userByUsername && userByUsername.is_premium) {
      user = userByUsername
    }
  }

  if (!user) {
    return notFound()
  }

  // Tambah jumlah tayangan
  let viewCount = 0
  try {
    // Cek apakah sudah ada data tayangan
    const { data: viewData, error: viewError } = await supabase
      .from("profile_views")
      .select("count")
      .eq("user_id", user.id)
      .single()

    if (viewError && viewError.code !== "PGRST116") {
      console.error("Error checking view count:", viewError)
    } else if (!viewData) {
      // Jika belum ada data tayangan, buat baru
      await supabase.from("profile_views").insert({
        user_id: user.id,
        count: 1,
      })
      viewCount = 1
    } else {
      // Jika sudah ada data tayangan, tambah 1
      viewCount = viewData.count + 1
      await supabase.from("profile_views").update({ count: viewCount }).eq("user_id", user.id)
    }
  } catch (error) {
    console.error("Error updating view count:", error)
  }

  // Get messages for this user
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Count total messages
  const messageCount = messages?.length || 0

  // Determine if we should show statistics
  // For owner or if the profile is public
  const isOwner = userId === user.id

  // Cek apakah ini adalah profil demo
  const isDemo = user.username && DEMO_USERNAMES.includes(user.username)

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Tambahkan komponen SEO */}
      <ProfileSeo user={user} />
      <ProfileSchema user={user} />

      <div className="w-full max-w-[56rem] mx-auto py-4 sm:py-8 px-4">
        {/* Profile Section */}
        <div className="flex flex-col items-center text-center mb-8">
          {/* Avatar with animation */}
          <div className="relative mb-4">
            <div className="relative h-24 w-24 md:h-32 md:w-32 overflow-hidden rounded-full border-2 border-black bg-white">
              {user.is_premium && user.avatar_url ? (
                <LazyAvatar
                  src={user.avatar_url}
                  alt={user.name || "User avatar"}
                  isPremium={user.is_premium}
                  fallbackText={user.name}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-4xl font-bold text-gray-600">
                  {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
            </div>

            {/* Badge premium yang menempel pada border */}
            {user.is_premium && (
              <div className="absolute top-0 right-0 z-20" style={{ transform: "translate(25%, -25%)" }}>
                <div className="bg-yellow-400 rounded-full p-1 flex items-center justify-center w-7 h-7 border border-black shadow-sm">
                  <Crown className="h-4 w-4 text-black" />
                </div>
              </div>
            )}
          </div>

          {/* Name and Username */}
          <h2 className="text-xl md:text-2xl font-bold" style={{ color: "var(--text)" }}>
            {user.name && user.name}
          </h2>
          <div className="relative z-10 text-sm md:text-base text-gray-600">
            @{user.username || user.numeric_id}
            {user.is_premium && (
              <span
                className="absolute -bottom-1 left-0 w-full h-3 -z-0 opacity-30"
                style={{ backgroundColor: "var(--main)" }}
              ></span>
            )}
          </div>

          {/* Bio dengan fitur tampilkan lebih - hanya untuk premium */}
          {user.is_premium && user.bio && (
            <div className="mt-4 mb-4 flex justify-center">
              <TruncatedBio bio={user.bio} maxLength={100} />
            </div>
          )}

          {/* Container for social media links and share button */}
          <div className="flex flex-col items-center gap-3">
            {/* Social media links - hanya untuk premium */}
            {user.is_premium && (
              <CustomSocialIcons
                instagramUrl={user.instagram_url}
                facebookUrl={user.facebook_url}
                linkedinUrl={user.linkedin_url}
                tiktokUrl={user.tiktok_url}
              />
            )}

            {/* Tombol share profile sebagai gambar - untuk semua pengguna */}
            <ProfileImageButton
              username={user.username || user.numeric_id.toString()}
              displayName={user.name}
              bio={user.bio || ""}
              avatarUrl={user.avatar_url}
              isPremium={user.is_premium}
              variant="ghost" // Ubah ke variant ghost
            />
          </div>
        </div>

        {/* Premium Feature Teaser - hanya untuk pengguna gratis */}
        {!user.is_premium && (
          <div className="mb-6">
            <PremiumFeatureTeaser />
          </div>
        )}

        {/* Send Message Form atau Demo Notice */}
        <div className="px-0 sm:px-0">
          {isDemo ? (
            <Card className="neo-card">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="bg-amber-100 p-3 rounded-full">
                    <Info className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Ini adalah Profil Demo</h3>
                    <p className="text-sm text-gray-600">
                      Pengiriman pesan dinonaktifkan untuk akun demo ini. Lihat fitur premium yang tersedia!
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button className="bg-amber-500 hover:bg-amber-600" size="sm" asChild>
                      <a href="/features">Lihat Fitur Premium</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <SendMessageForm user={user} />
          )}
        </div>

        {/* Messages Section */}
        <div className="mt-12">
          <div
            className="text-base mb-4 flex items-center justify-between border-b-2 border-black pb-2"
            style={{ color: "var(--text)" }}
          >
            <div className="flex items-center">
              Pesan untuk @{user.username || user.numeric_id}
              <span className="text-sm ml-2 opacity-60">({user.name})</span>
            </div>
          </div>
          <MessageList
            messages={messages || []}
            hideReadStatus={true}
            enableSharing={true}
            enablePublicReplies={true}
            isPublicView={true}
            username={user.username}
            numericId={user.numeric_id}
            displayName={user.name} // Tambahkan displayName ke MessageList
          />
        </div>
      </div>
      <ProfileCta />
    </div>
  )
}
