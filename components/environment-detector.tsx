"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { LoadingScreen } from "./loading-screen"

interface EnvironmentDetectorProps {
  children: React.ReactNode
}

export function EnvironmentDetector({ children }: EnvironmentDetectorProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulasi loading environment dengan timeout yang lebih pendek
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800) // Mengurangi waktu loading dari 1000ms menjadi 800ms

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <LoadingScreen message="Mempersiapkan aplikasi..." />
  }

  return <>{children}</>
}
