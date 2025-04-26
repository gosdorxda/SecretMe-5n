import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SendMessageFormWithNotification } from "./send-message-form-with-notification"
import { ProfilePreview } from "@/components/profile-preview"
import { ProfileSeo } from "@/components/profile-seo"
import { ProfileSchema } from "@/components/profile-schema"

interface ProfilePageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const supabase = createClient()

  const { data: user } = await supabase
    .from("users")
    .select("id, name, username, bio")
    .eq("username", params.slug)
    .single()

  if (!user) {
    return {
      title: "Profile Not Found",
      description: "The profile you are looking for does not exist.",
    }
  }

  return {
    title: `${user.name || user.username} | SecretMe`,
    description: user.bio || `Send anonymous messages to ${user.name || user.username}`,
    openGraph: {
      title: `${user.name || user.username} | SecretMe`,
      description: user.bio || `Send anonymous messages to ${user.name || user.username}`,
      url: `https://secretme.site/${params.slug}`,
      siteName: "SecretMe",
      locale: "id_ID",
      type: "website",
      images: [
        {
          url: `https://secretme.site/api/og?username=${params.slug}`,
          width: 1200,
          height: 630,
          alt: `${user.name || user.username}'s profile`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${user.name || user.username} | SecretMe`,
      description: user.bio || `Send anonymous messages to ${user.name || user.username}`,
      images: [`https://secretme.site/api/og?username=${params.slug}`],
    },
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const supabase = createClient()

  const { data: user } = await supabase
    .from("users")
    .select("id, name, username, bio, avatar_url, social_links, allow_public_replies")
    .eq("username", params.slug)
    .single()

  if (!user) {
    notFound()
  }

  return (
    <div className="container max-w-2xl py-10">
      <ProfileSeo user={user} />
      <ProfileSchema username={user.username} name={user.name} bio={user.bio} />

      <div className="space-y-8">
        <ProfilePreview
          name={user.name}
          username={user.username}
          bio={user.bio}
          avatarUrl={user.avatar_url}
          socialLinks={user.social_links}
          isPublic={true}
        />

        {/* Gunakan SendMessageFormWithNotification untuk memastikan notifikasi dipanggil */}
        <SendMessageFormWithNotification userId={user.id} username={user.username || user.id} />
      </div>
    </div>
  )
}
