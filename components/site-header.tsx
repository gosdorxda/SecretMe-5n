"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "@/lib/i18n/language-context"
import { LanguageToggle } from "@/components/language-toggle"

export function SiteHeader() {
  const { t, locale } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setLoading(false)
    }

    checkAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase.auth])

  // Determine if we're in English mode by checking the pathname
  const isEnglish = pathname.startsWith("/en")

  // Create prefix for all links based on current language
  const langPrefix = isEnglish ? "/en" : ""

  return (
    <header className="w-full py-4 bg-[var(--bg)]">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-4">
        <Link href={isEnglish ? "/en" : "/"} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--border-radius)] bg-[var(--main)] border-2 border-[var(--border)] shadow-neo-sm">
            <MessageSquare className="h-4 w-4 text-[var(--mtext)]" />
          </div>
          <span className="font-bold text-lg text-[var(--text)]">SecretMe</span>
        </Link>

        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <LanguageToggle />

          {!loading && !session ? (
            <Button className="rounded-full" size="sm" asChild>
              <Link href={`${langPrefix}/register`}>{isEnglish ? "Register" : "Mulai Sekarang"}</Link>
            </Button>
          ) : (
            <Button className="rounded-full" size="sm" asChild>
              <Link href={`${langPrefix}/dashboard`}>{isEnglish ? "Dashboard" : "Dashboard"}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
