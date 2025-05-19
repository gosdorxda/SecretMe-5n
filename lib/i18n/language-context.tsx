"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { translations } from "./translations"

type Locale = "id" | "en"

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: typeof translations.id
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "id",
  setLocale: () => {},
  t: translations.id,
})

export function LanguageProvider({
  children,
  initialLocale = "id",
}: {
  children: ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const [t, setT] = useState(translations[initialLocale])

  useEffect(() => {
    // Update translations when locale changes
    setT(translations[locale])

    // Save preference to localStorage
    localStorage.setItem("locale", locale)
  }, [locale])

  // Initialize from localStorage on client side
  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") as Locale | null
    if (savedLocale && (savedLocale === "id" || savedLocale === "en")) {
      setLocale(savedLocale)
    }
  }, [])

  return <LanguageContext.Provider value={{ locale, setLocale, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}
