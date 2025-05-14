"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { CheckCircle, Mail, Loader2 } from "lucide-react"

interface SuccessAnimationProps {
  onComplete?: () => void
  message?: string
  skipSending?: boolean
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  onComplete,
  message = "Pesan berhasil dikirim!",
  skipSending = false,
}) => {
  const [stage, setStage] = useState<"sending" | "success">(skipSending ? "success" : "sending")

  useEffect(() => {
    if (skipSending) {
      const completeTimer = setTimeout(() => {
        if (onComplete) onComplete()
      }, 2500)
      return () => clearTimeout(completeTimer)
    }

    const timer = setTimeout(() => {
      setStage("success")

      // Trigger onComplete callback after animation finishes
      const completeTimer = setTimeout(() => {
        if (onComplete) onComplete()
      }, 2500)

      return () => clearTimeout(completeTimer)
    }, 1000) // Reduced from 1500ms to 1000ms for faster feedback

    return () => clearTimeout(timer)
  }, [onComplete, skipSending])

  return (
    <div className="success-animation flex flex-col items-center justify-center py-8 px-4 text-center">
      {stage === "sending" ? (
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <Mail className="text-main envelope-bounce h-16 w-16" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-gray-400 spin-slow opacity-70" />
            </div>
          </div>
          <p className="text-lg font-medium">Mengirim pesan...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="success-circle relative">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="absolute h-16 w-16 rounded-full bg-green-500 opacity-20 animate-ping-once"></span>
              </div>
            </div>
          </div>
          <p className="success-message text-lg font-medium">{message}</p>
          <p className="text-sm text-gray-500 mt-2">Terima kasih atas pesan Anda!</p>
        </div>
      )}
    </div>
  )
}

export default SuccessAnimation
