"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type Locale, translations, type Translation } from "./translations"
import { usePathname, useRouter } from "next/navigation"

type LanguageContextType = {
  locale: Locale
  t: Translation
  changeLocale: (locale: Locale) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // Determine initial locale from URL
  const initialLocale: Locale = pathname.startsWith("/en") ? "en" : "id"
  const [locale, setLocale] = useState<Locale>(initialLocale)

  // Get translations for current locale
  const t = translations[locale]

  // Function to change locale
  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale)

    // Update URL to reflect new locale
    if (newLocale === "en") {
      // If current path is root or already has /en/, handle accordingly
      if (pathname === "/") {
        router.push("/en")
      } else if (pathname.startsWith("/en/")) {
        // Already in English path
        return
      } else if (pathname.startsWith("/en")) {
        // Already in English path
        return
      } else {
        // Replace with English path
        router.push(`/en${pathname}`)
      }
    } else {
      // If switching to Indonesian, remove /en/ prefix
      if (pathname.startsWith("/en/")) {
        router.push(pathname.substring(3))
      } else if (pathname === "/en") {
        router.push("/")
      } else if (pathname.startsWith("/en")) {
        router.push(pathname.substring(3))
      }
    }
  }

  // Update locale if URL changes
  useEffect(() => {
    const newLocale: Locale = pathname.startsWith("/en") ? "en" : "id"
    if (newLocale !== locale) {
      setLocale(newLocale)
    }
  }, [pathname, locale])

  return <LanguageContext.Provider value={{ locale, t, changeLocale }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
