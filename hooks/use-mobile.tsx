"use client"

import { useState, useEffect } from "react"

// Function to check if the device is mobile based on screen width
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Function to update state based on window width
    function handleResize() {
      setIsMobile(window.innerWidth < 768)
    }

    // Set initial value
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return isMobile
}

// Alias export for compatibility
export const useMobile = useIsMobile
