"use client"

import { useEffect, useState } from "react"

interface ProfileSeoProps {
  user: {
    name: string
    username: string | null
    numeric_id: number
    bio: string | null
    avatar_url: string | null
  }
}

export function ProfileSeo({ user }: ProfileSeoProps) {
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  if (!origin) return null

  const username = user.username || user.numeric_id
  const profileUrl = `${origin}/${username}`
  const title = `${user.name} (@${username}) | SecretMe`
  const description = `Kirim pesan anonim ke ${user.name} melalui SecretMe`
  const imageUrl = user.avatar_url || `${origin}/api/og?username=${username}&name=${encodeURIComponent(user.name)}`

  return (
    <>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />

      {/* Canonical URL */}
      <link rel="canonical" href={profileUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="profile" />
      <meta property="og:url" content={profileUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:profile:username" content={username.toString()} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={profileUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={imageUrl} />
    </>
  )
}
