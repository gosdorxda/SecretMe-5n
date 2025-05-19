import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/toaster"
import { EnvironmentDetector } from "@/components/environment-detector"
import { AuthProvider } from "@/components/auth-provider"
import { SiteHeader } from "@/components/site-header"
import { SeoMeta } from "@/components/seo-meta"
import { StickyNotificationProvider } from "@/components/sticky-notification-provider"
import { FooterProvider } from "@/components/footer-provider"
import { LanguageProvider } from "@/lib/i18n/language-context"
// Impor AuthTroubleshooter
import { AuthTroubleshooter } from "@/components/auth-troubleshooter"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SecretMe - Platform Pesan Anonim",
  description: "Terima pesan anonim dari siapapun dengan mudah dan aman",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.ico" />
        {/* SeoMeta tetap di sini, tapi sekarang menggunakan client-side rendering */}
        <SeoMeta />
      </head>
      <body className={inter.className}>
        <LanguageProvider>
          <AuthProvider>
            <EnvironmentDetector>
              <StickyNotificationProvider>
                <AuthTroubleshooter /> {/* Tambahkan komponen ini */}
                <FooterProvider>
                  <div className="relative flex min-h-screen flex-col">
                    <SiteHeader />
                    <main className="flex-1 w-full">{children}</main>
                  </div>
                </FooterProvider>
                <Toaster />
              </StickyNotificationProvider>
            </EnvironmentDetector>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
