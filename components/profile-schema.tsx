"use client"

import { useEffect, useState } from "react"

interface ProfileSchemaProps {
  user: {
    name: string
    username: string | null
    numeric_id: number
    bio: string | null
    avatar_url: string | null
    created_at: string
  }
}

export function ProfileSchema({ user }: ProfileSchemaProps) {
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  if (!origin) return null

  const username = user.username || user.numeric_id
  const profileUrl = `${origin}/${username}`
  const imageUrl = user.avatar_url || `${origin}/api/og?username=${username}&name=${encodeURIComponent(user.name)}`

  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user.name,
    alternateName: `@${username}`,
    description: user.bio || `Profil ${user.name} di SecretMe`,
    identifier: username.toString(),
    url: profileUrl,
    image: imageUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": profileUrl,
    },
    memberOf: {
      "@type": "Organization",
      name: "SecretMe",
      url: origin,
    },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}
