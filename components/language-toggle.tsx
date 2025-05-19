"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useLanguage } from "@/lib/i18n/language-context"

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage()
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const toggleLanguage = () => {
    const newLocale = locale === "en" ? "id" : "en"
    setLocale(newLocale)

    // Handle URL changes for language toggle
    let newPath = pathname

    if (pathname.startsWith("/en/")) {
      // If currently on English route, switch to Indonesian
      newPath = pathname.replace(/^\/en/, "")
    } else if (!pathname.startsWith("/en/") && newLocale === "en") {
      // If currently on Indonesian route and switching to English
      newPath = `/en${pathname}`
    }

    // Special case for root path
    if (pathname === "/" && newLocale === "en") {
      newPath = "/en"
    } else if (pathname === "/en" && newLocale === "id") {
      newPath = "/"
    }

    router.push(newPath)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="h-8 w-8 rounded-full"
      aria-label={locale === "en" ? "Switch to Indonesian" : "Switch to English"}
    >
      <Image
        src={locale === "en" ? "/flags/ID.svg" : "/flags/US.svg"}
        alt={locale === "en" ? "Indonesian flag" : "US flag"}
        width={20}
        height={20}
        className="rounded-sm"
      />
    </Button>
  )
}
