"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Send, Sparkles, AlertCircle, RefreshCw } from "lucide-react"
import { SuccessAnimation } from "@/components/success-animation"
import { SkeletonMessageForm } from "@/components/skeleton-message-form"
import { useLanguage } from "@/lib/i18n/language-context"

interface User {
  id: string
  name: string
  username: string | null
  is_premium: boolean
  numeric_id: number
}

interface SendMessageFormProps {
  user: User
  locale?: string // Add locale prop
}

// Message templates that visitors can choose from
const messageTemplates = {
  id: [
    "Hai, saya suka konten yang kamu bagikan!",
    "Boleh kenalan lebih dekat?",
    "Kamu inspirasi banget!",
    "Semangat terus ya!",
    "Saya punya pertanyaan nih...",
    "Keren banget profilmu!",
  ],
  en: [
    "Hi, I like the content you share!",
    "Can we get to know each other better?",
    "You're such an inspiration!",
    "Keep up the good work!",
    "I have a question...",
    "Your profile is awesome!",
  ],
}

// Cache for rate limit check results
interface RateLimitCache {
  timestamp: number
  result: {
    allowed: boolean
    reason?: string
  }
}

// Rate limit cache duration in milliseconds (5 seconds)
const RATE_LIMIT_CACHE_DURATION = 5000

export function SendMessageForm({ user, locale = "id" }: SendMessageFormProps) {
  const { t } = useLanguage()
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [characterCount, setCharacterCount] = useState(0)
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [rateLimitCache, setRateLimitCache] = useState<RateLimitCache | null>(null)
  const [isFormLoaded, setIsFormLoaded] = useState(false)
  const [optimisticSuccess, setOptimisticSuccess] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const lastMessageRef = useRef<string>("")
  const maxLength = 500
  const supabase = createClient()
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get the appropriate templates based on locale
  const templates = locale === "en" ? messageTemplates.en : messageTemplates.id

  // Simulate form loading to reduce perceived wait time
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFormLoaded(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // Reset rate limit cache when component mounts or user changes
  useEffect(() => {
    setRateLimitCache(null)
  }, [user.id])

  // Focus textarea when form is loaded
  useEffect(() => {
    if (isFormLoaded && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isFormLoaded])

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= maxLength) {
      setMessage(value)
      setCharacterCount(value.length)
    }
  }

  const selectTemplate = (template: string) => {
    setMessage(template)
    setCharacterCount(template.length)
    setShowTemplates(false)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const checkRateLimit = async (): Promise<boolean> => {
    try {
      // Check cache first
      const now = Date.now()
      if (rateLimitCache && now - rateLimitCache.timestamp < RATE_LIMIT_CACHE_DURATION) {
        console.log("Using cached rate limit result")

        if (!rateLimitCache.result.allowed) {
          setRateLimitError(
            rateLimitCache.result.reason ||
              (locale === "en"
                ? "Too many requests. Please try again later."
                : "Terlalu banyak permintaan. Coba lagi nanti."),
          )
        } else {
          setRateLimitError(null)
        }

        return rateLimitCache.result.allowed
      }

      console.log("Checking rate limit from server")
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch("/api/rate-limit/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: user.id,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      const data = await response.json()

      // Cache the result
      setRateLimitCache({
        timestamp: now,
        result: {
          allowed: response.ok,
          reason: data.reason,
        },
      })

      if (!response.ok) {
        setRateLimitError(
          data.reason ||
            (locale === "en"
              ? "Too many requests. Please try again later."
              : "Terlalu banyak permintaan. Coba lagi nanti."),
        )
        return false
      }

      setRateLimitError(null)
      return data.allowed
    } catch (error) {
      console.error("Error checking rate limit:", error)
      setRateLimitError(
        locale === "en"
          ? "An error occurred while checking the submission limit. Please try again later."
          : "Terjadi kesalahan saat memeriksa batas pengiriman. Coba lagi nanti.",
      )
      return false
    }
  }

  // Function to trigger notification
  const triggerNotification = async (messageId: string) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch("/api/notifications/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          messageId: messageId,
          type: "new_message",
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      if (!response.ok) {
        console.error("Failed to trigger notification:", await response.text())
      }
    } catch (error) {
      console.error("Error triggering notification:", error)
      // Non-critical error, continue
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      toast({
        title: locale === "en" ? "Message cannot be empty" : "Pesan tidak boleh kosong",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    setSendError(null)
    lastMessageRef.current = message

    // Show optimistic success feedback after a short delay
    // This creates the perception of faster response
    const optimisticTimer = setTimeout(() => {
      if (isSending) {
        setOptimisticSuccess(true)
      }
    }, 800)

    try {
      // Check rate limit before sending message
      const isAllowed = await checkRateLimit()

      if (!isAllowed) {
        clearTimeout(optimisticTimer)
        setOptimisticSuccess(false)
        toast({
          title: locale === "en" ? "Failed to send message" : "Gagal mengirim pesan",
          description:
            rateLimitError ||
            (locale === "en"
              ? "You have reached the message sending limit. Please try again later."
              : "Anda telah mencapai batas pengiriman pesan. Coba lagi nanti."),
          variant: "destructive",
        })
        setIsSending(false)
        return
      }

      // Send message to database
      const { data, error } = await supabase
        .from("messages")
        .insert({
          content: message,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Trigger notification if message was sent successfully (non-blocking)
      if (data && data.id) {
        triggerNotification(data.id).catch(console.error)
      }

      // Report rate limit (non-blocking)
      fetch("/api/rate-limit/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: user.id,
        }),
      }).catch(console.error)

      // Invalidate rate limit cache after successful send
      setRateLimitCache(null)

      // Clear optimistic timer and show real success
      clearTimeout(optimisticTimer)
      setOptimisticSuccess(false)
      setShowSuccess(true)
    } catch (error: any) {
      clearTimeout(optimisticTimer)
      setOptimisticSuccess(false)
      console.error(error)
      setSendError(
        error.message ||
          (locale === "en" ? "An error occurred while sending the message" : "Terjadi kesalahan saat mengirim pesan"),
      )
      toast({
        title: locale === "en" ? "Failed to send message" : "Gagal mengirim pesan",
        description:
          error.message ||
          (locale === "en" ? "An error occurred while sending the message" : "Terjadi kesalahan saat mengirim pesan"),
        variant: "destructive",
      })
      setIsSending(false)
    }
  }

  const handleRetry = useCallback(() => {
    setIsRetrying(true)
    setSendError(null)

    // Simulate a brief delay before retrying
    setTimeout(() => {
      setIsRetrying(false)
      setIsSending(false)
    }, 500)
  }, [])

  const handleAnimationComplete = () => {
    setShowSuccess(false)
    setIsSending(false)
    setMessage("")
    setCharacterCount(0)
  }

  // Show skeleton loading while form is loading
  if (!isFormLoaded) {
    return <SkeletonMessageForm />
  }

  // Show optimistic success feedback
  if (optimisticSuccess) {
    return (
      <Card className="neo-card">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className="relative mb-4">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-gray-300 border-t-transparent animate-spin"></div>
              </div>
            </div>
            <p className="text-lg font-medium">{locale === "en" ? "Sending message..." : "Mengirim pesan..."}</p>
            <p className="text-sm text-gray-500 mt-2">
              {locale === "en" ? "Your message is being processed" : "Pesan Anda sedang diproses"}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show success animation
  if (showSuccess) {
    return (
      <Card className="neo-card">
        <CardContent className="p-6">
          <SuccessAnimation onComplete={handleAnimationComplete} locale={locale} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="neo-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{locale === "en" ? "Send Anonymous Message" : "Kirim Pesan Anonim"}</CardTitle>
        <CardDescription>
          {locale === "en"
            ? `Send anonymous message to ${user.name || `@${user.username || user.numeric_id}`}`
            : `Kirim pesan anonim ke ${user.name || `@${user.username || user.numeric_id}`}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder={
                  locale === "en" ? "Write your anonymous message here..." : "Tulis pesan anonim Anda di sini..."
                }
                value={message}
                onChange={handleMessageChange}
                className="min-h-[120px] resize-none"
                maxLength={maxLength}
                disabled={isSending}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
                onClick={() => setShowTemplates(!showTemplates)}
                title={locale === "en" ? "Use message template" : "Gunakan template pesan"}
                disabled={isSending}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>

            {showTemplates && (
              <div className="bg-white rounded-md shadow-md p-2 border border-gray-200 mt-1 max-h-[200px] overflow-y-auto">
                <div className="text-sm font-medium mb-2 text-gray-500">
                  {locale === "en" ? "Choose Message Template:" : "Pilih Template Pesan:"}
                </div>
                <div className="space-y-1">
                  {templates.map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors"
                      onClick={() => selectTemplate(template)}
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <span
                className={`text-xs ${characterCount > maxLength * 0.8 ? "text-orange-500" : "text-muted-foreground"}`}
              >
                {characterCount}/{maxLength}
              </span>
            </div>
          </div>

          {rateLimitError && (
            <div className="text-sm text-red-500 p-2 bg-red-50 rounded-md flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{rateLimitError}</span>
            </div>
          )}

          {sendError && (
            <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{locale === "en" ? "Failed to send message" : "Gagal mengirim pesan"}</p>
                <p className="mt-1">{sendError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs h-8"
                  onClick={handleRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <>
                      <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      {locale === "en" ? "Retrying..." : "Mencoba ulang..."}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-1 h-3 w-3" />
                      {locale === "en" ? "Try again" : "Coba lagi"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full neo-btn transition-all duration-200 relative overflow-hidden"
            disabled={isSending || !message.trim()}
          >
            {isSending ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                {locale === "en" ? "Sending..." : "Mengirim..."}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {locale === "en" ? "Send Message" : "Kirim Pesan"}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
