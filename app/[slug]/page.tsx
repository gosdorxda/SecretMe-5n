import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SendMessageFormWithNotification } from "./send-message-form-with-notification"
import { MessageList } from "@/components/message-list"
import { User, Crown, Instagram, Facebook, Linkedin } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { ProfileCta } from "@/components/profile-cta"
import { ProfileSeo } from "@/components/profile-seo"
import { ProfileSchema } from "@/components/profile-schema"

// Tambahkan metadata statis untuk SEO dasar
export const metadata = {
  title: "Profil Pengguna | SecretMe",
  description: "Kirim pesan anonim ke pengguna SecretMe",
}

export default async function ProfilePage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const supabase = createClient()

  // Cek session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Jika ada session, verifikasi user dengan getUser()
  let userId = null
  if (session) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (!userError && user) {
      userId = user.id
    }
  }

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

    if (userByUsername && userByUsername.is_premium) {
      user = userByUsername
    }
  }

  if (!user) {
    return notFound()
  }

  // Tambah jumlah tayangan
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
    } else {
      // Jika sudah ada data tayangan, tambah 1
      await supabase
        .from("profile_views")
        .update({ count: viewData.count + 1 })
        .eq("user_id", user.id)
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

  // Check if user has any social media links
  const hasSocialLinks = user.instagram_url || user.facebook_url || user.linkedin_url || user.tiktok_url

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
            {user.is_premium && (
              <Badge className="absolute -top-2 -right-2 z-10 bg-[rgb(250,204,21)] text-black border border-black flex items-center gap-1">
                <Crown className="h-3 w-3" /> Premium
              </Badge>
            )}
            <div className="relative h-24 w-24 md:h-32 md:w-32 overflow-hidden rounded-full border-2 border-black bg-white">
              {user.is_premium && user.avatar_url ? (
                <Image
                  src={user.avatar_url || "/placeholder.svg"}
                  alt={user.name}
                  className="h-full w-full object-cover"
                  width={128}
                  height={128}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-50">
                  <User className="h-16 w-16 text-gray-300" />
                </div>
              )}
            </div>
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

          {/* Bio */}
          {user.is_premium && user.bio && (
            <p className="text-base leading-relaxed opacity-75 max-w-md mt-2" style={{ color: "var(--text)" }}>
              {user.bio}
            </p>
          )}

          {/* Social media links */}
          {user.is_premium && hasSocialLinks && (
            <div className="flex gap-2 mt-3">
              {user.instagram_url && (
                <a
                  href={user.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white border-2 border-[var(--border)]"
                  title="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {user.facebook_url && (
                <a
                  href={user.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white border-2 border-[var(--border)]"
                  title="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {user.linkedin_url && (
                <a
                  href={user.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-700 text-white border-2 border-[var(--border)]"
                  title="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {user.tiktok_url && (
                <a
                  href={user.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-black text-white border-2 border-[var(--border)"
                  title="TikTok"
                >
                  <span className="font-bold text-sm">T</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Send Message Form */}
        <div className="px-0 sm:px-0">
          <SendMessageFormWithNotification userId={user.id} username={user.username || user.numeric_id.toString()} />
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
          />
        </div>
      </div>
      <ProfileCta />
    </div>
  )
}
