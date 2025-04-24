"use client"

import { useRef, useState } from "react"
import { Card, type CardProps } from "@/components/ui/card"
import { shareImage } from "@/lib/dom-to-image"
import { cn } from "@/lib/utils"
import html2canvas from "html2canvas"

interface ShareableCardProps extends CardProps {
  title?: string
  shareText?: string
}

export function ShareableCard({
  children,
  className,
  title = "Shared Card",
  shareText = "Check out this card!",
  ...props
}: ShareableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async () => {
    if (!cardRef.current) return

    setIsSharing(true)
    try {
      // Clone the card element to remove the share button before generating the image
      const clonedCard = cardRef.current.cloneNode(true) as HTMLElement
      const shareButton = clonedCard.querySelector(".card-share-button")
      if (shareButton) {
        shareButton.parentNode?.removeChild(shareButton)
      }

      // Enhance styling for capture
      const badges = clonedCard.querySelectorAll('[class*="Badge"], [class*="badge"]')
      badges.forEach((badge) => {
        const badgeElement = badge as HTMLElement

        // Tambahkan kelas khusus untuk styling yang konsisten
        badgeElement.classList.add("capture-badge")

        // Terapkan styling inline yang lebih lengkap
        badgeElement.style.padding = "4px 10px"
        badgeElement.style.backgroundColor = "#f3f4f6"
        badgeElement.style.borderColor = "#d1d5db"
        badgeElement.style.color = "#374151"
        badgeElement.style.fontWeight = "500"
        badgeElement.style.borderRadius = "6px"
        badgeElement.style.fontSize = "12px"
        badgeElement.style.lineHeight = "1.5"
        badgeElement.style.display = "inline-flex"
        badgeElement.style.alignItems = "center"
        badgeElement.style.justifyContent = "center"
        badgeElement.style.border = "1px solid #d1d5db"
        badgeElement.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)"
        badgeElement.style.whiteSpace = "nowrap"
        badgeElement.style.textTransform = "none"
        badgeElement.style.letterSpacing = "0"
      })

      // Enhance text elements for better readability in the capture
      const textElements = clonedCard.querySelectorAll("p, span, div")
      textElements.forEach((el) => {
        const textEl = el as HTMLElement
        if (textEl.style.fontSize && Number.parseInt(textEl.style.fontSize) < 12) {
          textEl.style.fontSize = "12px"
        }
        // Improve text rendering
        textEl.style.textRendering = "optimizeLegibility"
      })

      // Create a wrapper with padding
      const wrapper = document.createElement("div")
      wrapper.style.position = "absolute"
      wrapper.style.left = "-9999px"
      wrapper.style.padding = "40px" // Add padding around the element
      wrapper.style.backgroundColor = "white" // White background
      wrapper.style.display = "inline-block"
      wrapper.style.borderRadius = "12px" // Rounded corners
      wrapper.style.boxShadow = "0 4px 24px rgba(0, 0, 0, 0.1)" // Add subtle shadow

      // Set the clone's dimensions to match the original
      clonedCard.style.width = `${cardRef.current.offsetWidth}px`
      clonedCard.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)"

      // Cari kode watermark yang ada
      let watermark = document.createElement("div")
      watermark.style.position = "absolute"
      watermark.style.bottom = "12px"
      watermark.style.right = "12px"
      watermark.style.fontSize = "11px"
      watermark.style.color = "rgba(0, 0, 0, 0.3)"
      watermark.style.fontFamily = "Arial, sans-serif"
      watermark.style.pointerEvents = "none"
      watermark.textContent = "SecretMe"

      // Ganti dengan watermark yang lebih menarik
      watermark = document.createElement("div")
      watermark.style.position = "absolute"
      watermark.style.bottom = "12px"
      watermark.style.right = "12px"
      watermark.style.padding = "4px 8px"
      watermark.style.backgroundColor = "#fd9745"
      watermark.style.color = "#000000"
      watermark.style.fontFamily = "Arial, sans-serif"
      watermark.style.fontSize = "12px"
      watermark.style.fontWeight = "bold"
      watermark.style.borderRadius = "6px"
      watermark.style.border = "2px solid #000"
      watermark.style.boxShadow = "2px 2px 0px 0px #000"
      watermark.style.display = "flex"
      watermark.style.alignItems = "center"
      watermark.style.gap = "4px"
      watermark.style.pointerEvents = "none"
      watermark.style.zIndex = "999"

      // Tambahkan ikon dan teks
      watermark.innerHTML = `
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
  <span>SecretMe</span>
`

      // Append the clone to the wrapper
      wrapper.appendChild(clonedCard)
      wrapper.appendChild(watermark)

      // Temporarily append the wrapper to the DOM
      document.body.appendChild(wrapper)

      // Generate image from the wrapper with higher quality
      const canvas = await html2canvas(wrapper, {
        scale: 4, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: "white",
      })

      // Remove the wrapper
      document.body.removeChild(wrapper)

      // Convert to data URL with maximum quality
      const dataUrl = canvas.toDataURL("image/png", 1.0)

      if (dataUrl) {
        shareImage(dataUrl, title, shareText)
      }
    } catch (error) {
      console.error("Error sharing card:", error)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Card ref={cardRef} className={cn("relative", className)} {...props}>
      {children}
    </Card>
  )
}
