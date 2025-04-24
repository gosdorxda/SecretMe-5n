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
        <SeoMeta />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <EnvironmentDetector>
            <StickyNotificationProvider>
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
      </body>
    </html>
  )
}
