"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { LanguageToggle } from "./language-toggle"
import { useLanguage } from "@/lib/i18n/language-context"

export function SiteHeader() {
  const { t, locale } = useLanguage()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      setIsLoggedIn(!!data.session)
    }

    checkAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase.auth])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href={locale === "en" ? "/en" : "/"} className="flex items-center gap-2">
            <span className="font-bold text-xl">SecretMe</span>
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          {/* Language Toggle - Added here */}
          <LanguageToggle />

          {isLoggedIn ? (
            <>
              <Link
                href={locale === "en" ? "/en/dashboard" : "/dashboard"}
                className={`text-sm font-medium ${
                  pathname === "/dashboard" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.common.dashboard}
              </Link>
            </>
          ) : (
            <>
              <Link
                href={locale === "en" ? "/en/login" : "/login"}
                className={`text-sm font-medium ${
                  pathname === "/login" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.common.login}
              </Link>
              <Link
                href={locale === "en" ? "/en/register" : "/register"}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {t.common.register}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
