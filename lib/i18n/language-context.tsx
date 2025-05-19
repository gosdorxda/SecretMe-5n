"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { translations, type Locale, type Translation } from "./translations"

type LanguageContextType = {
  locale: Locale
  t: Translation
  changeLocale: (locale: Locale) => void
}

// Create a default context value to avoid undefined errors
const defaultContextValue: LanguageContextType = {
  locale: "id",
  t: translations.id,
  changeLocale: () => {},
}

const LanguageContext = createContext<LanguageContextType>(defaultContextValue)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [locale, setLocale] = useState<Locale>("id")

  // Detect locale from URL on initial load and when pathname changes
  useEffect(() => {
    if (pathname.startsWith("/en")) {
      setLocale("en")
    } else {
      setLocale("id")
    }
  }, [pathname])

  const changeLocale = (newLocale: Locale) => {
    if (newLocale === locale) return

    // Get the current path without the language prefix
    let newPath = pathname
    if (pathname.startsWith("/en")) {
      newPath = pathname.replace(/^\/en/, "")
      if (newPath === "") newPath = "/"
    }

    // Add the new language prefix if needed
    if (newLocale === "en") {
      newPath = `/en${newPath === "/" ? "" : newPath}`
    }

    // Navigate to the new path
    router.push(newPath)
    setLocale(newLocale)
  }

  return (
    <LanguageContext.Provider
      value={{
        locale,
        t: translations[locale],
        changeLocale,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

// Original hook - keep for backward compatibility
export function useLanguage() {
  const context = useContext(LanguageContext)
  return context
}

// Add the missing useTranslation export that's being referenced elsewhere
export function useTranslation() {
  const context = useContext(LanguageContext)
  return {
    t: context.t,
    locale: context.locale,
    changeLocale: context.changeLocale,
  }
}
