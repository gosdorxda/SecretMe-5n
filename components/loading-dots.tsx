"use client"

import { cn } from "@/lib/utils"

interface LoadingDotsProps {
  className?: string
  color?: string
}

export function LoadingDots({ className, color = "bg-primary" }: LoadingDotsProps) {
  return (
    <div className={cn("flex space-x-2 justify-center items-center", className)}>
      <div className={cn("h-2 w-2 rounded-full animate-bounce", color)} style={{ animationDelay: "0ms" }}></div>
      <div className={cn("h-2 w-2 rounded-full animate-bounce", color)} style={{ animationDelay: "150ms" }}></div>
      <div className={cn("h-2 w-2 rounded-full animate-bounce", color)} style={{ animationDelay: "300ms" }}></div>
    </div>
  )
}
