"use client"

import { useState } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"

interface LazyAvatarProps {
  src: string | null
  alt: string
  isPremium?: boolean
  fallbackText?: string
}

export function LazyAvatar({ src, alt, isPremium = false, fallbackText = "?" }: LazyAvatarProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Jika tidak ada src atau terjadi error, tampilkan fallback
  const shouldShowFallback = !src || hasError

  return (
    <div className="relative h-full w-full">
      {!shouldShowFallback ? (
        <>
          <Image
            src={src || "/placeholder.svg"}
            alt={alt}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            fill
            sizes="(max-width: 768px) 96px, 128px"
            onLoadingComplete={() => setIsLoading(false)}
            onError={() => {
              setHasError(true)
              setIsLoading(false)
            }}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-4xl font-bold text-gray-600">
          {fallbackText ? fallbackText.charAt(0).toUpperCase() : "?"}
        </div>
      )}
    </div>
  )
}
