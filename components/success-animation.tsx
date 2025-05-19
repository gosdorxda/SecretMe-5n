"use client"

import { useEffect, useState } from "react"
import { CheckCircle } from "lucide-react"

interface SuccessAnimationProps {
  onComplete?: () => void
  locale?: string
}

export function SuccessAnimation({ onComplete, locale = "id" }: SuccessAnimationProps) {
  const [showCheckmark, setShowCheckmark] = useState(false)
  const [showText, setShowText] = useState(false)
  const [showSubtext, setShowSubtext] = useState(false)

  useEffect(() => {
    // Start animation sequence
    const checkmarkTimer = setTimeout(() => {
      setShowCheckmark(true)
    }, 300)

    const textTimer = setTimeout(() => {
      setShowText(true)
    }, 800)

    const subtextTimer = setTimeout(() => {
      setShowSubtext(true)
    }, 1200)

    // Complete animation after 3 seconds
    const completeTimer = setTimeout(() => {
      if (onComplete) {
        onComplete()
      }
    }, 3000)

    // Clean up timers
    return () => {
      clearTimeout(checkmarkTimer)
      clearTimeout(textTimer)
      clearTimeout(subtextTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="relative mb-4">
        <div
          className={`h-16 w-16 rounded-full bg-green-50 flex items-center justify-center transition-all duration-500 ${
            showCheckmark ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        >
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
      </div>
      <p
        className={`text-lg font-medium transition-all duration-500 ${
          showText ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {locale === "en" ? "Message Sent Successfully!" : "Pesan Berhasil Terkirim!"}
      </p>
      <p
        className={`text-sm text-gray-500 mt-2 transition-all duration-500 ${
          showSubtext ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {locale === "en" ? "Your anonymous message has been delivered" : "Pesan anonim Anda telah tersampaikan"}
      </p>
    </div>
  )
}
