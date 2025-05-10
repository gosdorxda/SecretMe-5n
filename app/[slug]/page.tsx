import { notFound, redirect } from "next/navigation"
import { createClient, getVerifiedUser } from "@/lib/supabase/server"
import { SendMessageForm } from "./send-message-form"
import { MessageList } from "@/components/message-list"
import { User, Crown } from "lucide-react"
import Image from "next/image"
import { ProfileCta } from "@/components/profile-cta"
import { ProfileSeo } from "@/components/profile-seo"
import { ProfileSchema } from "@/components/profile-schema"
import { CustomSocialIcons } from "@/components/custom-social-icons"
import { ProfileImageButton } from "@/components/profile-image-button"
import { TruncatedBio } from "@/components/truncated-bio"

// Tambahkan metadata statis untuk SEO dasar
export const metadata = {
  title: "Profil Pengguna | SecretMe",
  description: "Kirim pesan anonim ke pengguna SecretMe",
}

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

          {/* Bio dengan fitur tampilkan lebih */}
          {user.is_premium && user.bio && (
            <div className="mt-4 mb-4 flex justify-center">
              <TruncatedBio bio={user.bio} maxLength={100} />
            </div>
          )}

          {/* Social media links - Menggunakan komponen CustomSocialIcons */}
          {user.is_premium && (
            <div className="flex flex-col items-center gap-3 mt-3">
              <CustomSocialIcons
                instagramUrl={user.instagram_url}
                facebookUrl={user.facebook_url}
                linkedinUrl={user.linkedin_url}
                tiktokUrl={user.tiktok_url}
              />

              {/* Tombol share profile sebagai gambar */}
              <ProfileImageButton
                username={user.username || user.numeric_id.toString()}
                displayName={user.name}
                bio={user.bio || ""}
                avatarUrl={user.avatar_url}
                isPremium={user.is_premium}
              />
            </div>
          )}
        </div>

        {/* Send Message Form */}
        <div className="px-0 sm:px-0">
          <SendMessageForm user={user} />
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
