"use client"

import { Instagram, Facebook, Linkedin } from "lucide-react"

interface SocialMediaLinksProps {
  instagramUrl: string | null
  facebookUrl: string | null
  linkedinUrl: string | null
  tiktokUrl: string | null
}

export function SocialMediaLinks({ instagramUrl, facebookUrl, linkedinUrl, tiktokUrl }: SocialMediaLinksProps) {
  const hasSocialLinks = instagramUrl || facebookUrl || linkedinUrl || tiktokUrl

  if (!hasSocialLinks) {
    return null
  }

  return (
    <div className="flex gap-2">
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-9 h-9 rounded-[var(--border-radius)] bg-gradient-to-br from-pink-500 to-purple-600 text-white border-2 border-border shadow-neo-sm hover:shadow-none transition-all duration-200"
          title="Instagram"
        >
          <Instagram className="h-4 w-4" />
        </a>
      )}
      {facebookUrl && (
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-9 h-9 rounded-[var(--border-radius)] bg-blue-600 text-white border-2 border-border shadow-neo-sm hover:shadow-none transition-all duration-200"
          title="Facebook"
        >
          <Facebook className="h-4 w-4" />
        </a>
      )}
      {linkedinUrl && (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-9 h-9 rounded-[var(--border-radius)] bg-blue-700 text-white border-2 border-border shadow-neo-sm hover:shadow-none transition-all duration-200"
          title="LinkedIn"
        >
          <Linkedin className="h-4 w-4" />
        </a>
      )}
      {tiktokUrl && (
        <a
          href={tiktokUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-9 h-9 rounded-[var(--border-radius)] bg-black text-white border-2 border-border shadow-neo-sm hover:shadow-none transition-all duration-200"
          title="TikTok"
        >
          <span className="font-bold text-sm">T</span>
        </a>
      )}
    </div>
  )
}
