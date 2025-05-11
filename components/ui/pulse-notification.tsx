"use client"

import type * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface PulseNotificationProps {
  children: React.ReactNode
  className?: string
  pulseColor?: string
  pulseSize?: "sm" | "md" | "lg"
  pulseIntensity?: "low" | "medium" | "high"
  pulseSpeed?: "slow" | "medium" | "fast"
}

export function PulseNotification({
  children,
  className,
  pulseColor = "rgba(255, 86, 48, 0.7)",
  pulseSize = "md",
  pulseIntensity = "medium",
  pulseSpeed = "medium",
}: PulseNotificationProps) {
  const sizeMap = {
    sm: "h-1 w-1",
    md: "h-2 w-2",
    lg: "h-3 w-3",
  }

  const intensityMap = {
    low: "opacity-30",
    medium: "opacity-50",
    high: "opacity-70",
  }

  const speedMap = {
    slow: 3,
    medium: 2,
    fast: 1,
  }

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <motion.span
        className={cn(
          "absolute right-0 top-0 rounded-full bg-red-500 -mr-1 -mt-1",
          sizeMap[pulseSize],
          intensityMap[pulseIntensity],
        )}
        style={{ backgroundColor: pulseColor }}
      />
      <motion.span
        className={cn("absolute right-0 top-0 rounded-full -mr-1 -mt-1", sizeMap[pulseSize])}
        style={{ backgroundColor: pulseColor }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.7, 0.2, 0.7],
        }}
        transition={{
          duration: speedMap[pulseSpeed],
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      {children}
    </div>
  )
}
