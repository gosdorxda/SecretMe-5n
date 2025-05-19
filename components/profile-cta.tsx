"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { X } from "lucide-react"

interface ProfileCtaProps {
  locale?: string
}

export function ProfileCta({ locale = "id" }: ProfileCtaProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-0 right-0 mx-auto w-full max-w-md px-4 z-50">
      <div className="bg-white border-2 border-black rounded-[var(--border-radius)] p-4 shadow-neo relative">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full"
          aria-label={locale === "en" ? "Close" : "Tutup"}
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="font-bold mb-2">
          {locale === "en" ? "Want a page like this?" : "Ingin punya halaman seperti ini?"}
        </h3>
        <p className="text-sm mb-3">
          {locale === "en"
            ? "Create a SecretMe account now and receive anonymous messages from your friends!"
            : "Buat akun SecretMe sekarang dan terima pesan anonim dari teman-temanmu!"}
        </p>

        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={locale === "en" ? "/en/login" : "/login"}>{locale === "en" ? "Login" : "Masuk"}</Link>
          </Button>
          <Button asChild size="sm" className="flex-1">
            <Link href={locale === "en" ? "/en/register" : "/register"}>{locale === "en" ? "Register" : "Daftar"}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
