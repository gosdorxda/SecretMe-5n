"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface SeoConfig {
  site_title: string
  site_description: string
  site_keywords: string
  og_title: string
  og_description: string
  og_image_url: string
  favicon_url: string
  twitter_handle: string
  google_analytics_id: string
  custom_head_tags: string
}

const defaultSeoConfig: SeoConfig = {
  site_title: "SecretMe - Platform Pesan Anonim",
  site_description: "Terima pesan anonim dari siapapun dengan mudah dan aman",
  site_keywords: "pesan anonim, secret message, anonymous message, feedback anonim",
  og_title: "SecretMe - Platform Pesan Anonim Terbaik",
  og_description: "Terima pesan anonim dari siapapun dengan mudah dan aman. Daftar sekarang gratis!",
  og_image_url: "",
  favicon_url: "/favicon.ico",
  twitter_handle: "@secretme",
  google_analytics_id: "",
  custom_head_tags: "",
}

export function SeoMeta() {
  const [config, setConfig] = useState<SeoConfig>(defaultSeoConfig)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Modificar la función fetchSeoConfig para manejar mejor el caso cuando la tabla no existe
    const fetchSeoConfig = async () => {
      try {
        // Intentar obtener la configuración SEO
        const { data, error } = await supabase.from("site_config").select("*").eq("type", "seo").single()

        if (error) {
          // Si el error es porque la tabla no existe o no hay datos, usar la configuración predeterminada
          if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
            console.log("No SEO config found or table doesn't exist, using default")
            // No lanzar error, simplemente usar valores predeterminados
          } else {
            console.error("Error fetching SEO config:", error)
          }
        } else if (data?.config) {
          setConfig({ ...defaultSeoConfig, ...data.config })
        }
      } catch (error) {
        // Capturar cualquier otro error sin interrumpir el renderizado
        console.error("Error in SEO config:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSeoConfig()
  }, [])

  if (isLoading) {
    return null
  }

  return (
    <>
      <title>{config.site_title}</title>
      <meta name="description" content={config.site_description} />
      <meta name="keywords" content={config.site_keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={typeof window !== "undefined" ? window.location.origin : ""} />
      <meta property="og:title" content={config.og_title} />
      <meta property="og:description" content={config.og_description} />
      {config.og_image_url && <meta property="og:image" content={config.og_image_url} />}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={typeof window !== "undefined" ? window.location.origin : ""} />
      <meta property="twitter:title" content={config.og_title} />
      <meta property="twitter:description" content={config.og_description} />
      {config.og_image_url && <meta property="twitter:image" content={config.og_image_url} />}
      {config.twitter_handle && <meta property="twitter:site" content={config.twitter_handle} />}

      {/* Favicon */}
      <link rel="icon" href={config.favicon_url} />

      {/* Google Analytics 4 (GA4) Configuration */}
      {config.google_analytics_id && (
        <>
          <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
          <script
            dangerouslySetInnerHTML={{
              __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              
              // GA4 configuration with recommended settings
              gtag('config', '${config.google_analytics_id}', {
                send_page_view: true,
                cookie_flags: 'samesite=none;secure',
                cookie_domain: 'auto',
                anonymize_ip: true
              });
            `,
            }}
          />
        </>
      )}

      {/* Custom Head Tags */}
      {config.custom_head_tags && <div dangerouslySetInnerHTML={{ __html: config.custom_head_tags }} />}
    </>
  )
}
