"use client"

import { SocialIcon } from "react-social-icons"

interface SocialMediaIconsProps {
  instagramUrl: string | null
  facebookUrl: string | null
  linkedinUrl: string | null
  tiktokUrl: string | null
}

export function SocialMediaIcons({ instagramUrl, facebookUrl, linkedinUrl, tiktokUrl }: SocialMediaIconsProps) {
  const hasSocialLinks = instagramUrl || facebookUrl || linkedinUrl || tiktokUrl

  if (!hasSocialLinks) {
    return null
  }

  return (
    <div className="flex gap-2 mt-3">
      {instagramUrl && (
        <SocialIcon
          url={instagramUrl}
          network="instagram"
          style={{ width: 36, height: 36 }}
          target="_blank"
          rel="noopener noreferrer"
        />
      )}
      {facebookUrl && (
        <SocialIcon
          url={facebookUrl}
          network="facebook"
          style={{ width: 36, height: 36 }}
          target="_blank"
          rel="noopener noreferrer"
        />
      )}
      {linkedinUrl && (
        <SocialIcon
          url={linkedinUrl}
          network="linkedin"
          style={{ width: 36, height: 36 }}
          target="_blank"
          rel="noopener noreferrer"
        />
      )}
      {tiktokUrl && (
        <SocialIcon
          url={tiktokUrl}
          network="tiktok"
          style={{ width: 36, height: 36 }}
          target="_blank"
          rel="noopener noreferrer"
        />
      )}
    </div>
  )
}
