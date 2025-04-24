"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { LoadingDots } from "./loading-dots"

interface LoadingAnimationProps {
  className?: string
  variant?: "pulse" | "wave" | "dots"
  message?: string
}

export function LoadingAnimation({ className, variant = "pulse", message = "Memuat data" }: LoadingAnimationProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer)
          return 100
        }
        const increment = Math.floor(Math.random() * 10) + 1
        return Math.min(prevProgress + increment, 100)
      })
    }, 600)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return (
    <div className={cn("flex flex-col items-center justify-center p-6", className)}>
      {variant === "pulse" && (
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
          <div className="absolute inset-2 rounded-full bg-primary/40 animate-pulse"></div>
          <div
            className="absolute inset-4 rounded-full bg-primary/60 animate-pulse"
            style={{ animationDelay: "300ms" }}
          ></div>
          <div
            className="absolute inset-6 rounded-full bg-primary/80 animate-pulse"
            style={{ animationDelay: "600ms" }}
          ></div>
        </div>
      )}

      {variant === "wave" && (
        <div className="flex space-x-1 items-center justify-center h-16">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 bg-primary rounded-full animate-wave"
              style={{
                height: `${Math.max(20, Math.random() * 60)}%`,
                animationDelay: `${i * 100}ms`,
              }}
            ></div>
          ))}
        </div>
      )}

      {variant === "dots" && <LoadingDots className="py-4" />}

      <div className="mt-6 w-full max-w-xs">
        <div className="text-sm text-center text-muted-foreground mb-2">{message}</div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="mt-1 text-xs text-right text-muted-foreground">{progress}%</div>
      </div>
    </div>
  )
}
