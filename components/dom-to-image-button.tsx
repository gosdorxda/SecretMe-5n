"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"
import html2canvas from "html2canvas"

interface DomToImageButtonProps {
  selector: string
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
  title?: string
  shareText?: string
  className?: string
  floating?: boolean
}

export function DomToImageButton({
  selector,
  position = "top-right",
  title = "Shared Image",
  shareText = "Check this out!",
  className = "",
  floating = true,
}: DomToImageButtonProps) {
  const [isSharing, setIsSharing] = useState(false)

  const positionClasses = {
    "top-right": "top-2 right-2",
    "top-left": "top-2 left-2",
    "bottom-right": "bottom-2 right-2",
    "bottom-left": "bottom-2 left-2",
  }

  // Ubah fungsi handleShare untuk menghasilkan gambar dengan spesifikasi yang diminta

  const handleShare = async () => {
    const element = document.querySelector(selector)
    if (!element) {
      console.error(`Element with selector "${selector}" not found`)
      return
    }

    setIsSharing(true)
    try {
      // Get the original element's dimensions
      const originalWidth = element.clientWidth
      const originalHeight = element.clientHeight

      // Clone the element to remove any share buttons
      const clone = element.cloneNode(true) as HTMLElement

      // Remove share buttons from the clone
      const shareButtons = clone.querySelectorAll(".dom-to-image-button")
      shareButtons.forEach((button) => {
        button.parentNode?.removeChild(button)
      })

      // Enhance styling for capture
      const badges = clone.querySelectorAll('[class*="Badge"], [class*="badge"]')
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
      const textElements = clone.querySelectorAll("p, span, div")
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
      wrapper.style.padding = "80px" // Tambah padding yang lebih besar (80px) di sekitar elemen
      wrapper.style.backgroundColor = "#f5f5f5" // Warna background yang sesuai dengan proyek
      wrapper.style.display = "inline-block"
      wrapper.style.borderRadius = "0px" // Hapus border radius pada wrapper
      wrapper.style.boxShadow = "none" // Hapus shadow pada wrapper

      // Set the clone's dimensions to match the original
      clone.style.width = `${originalWidth}px`
      clone.style.height = `${originalHeight}px`
      clone.style.backgroundColor = "white" // Pastikan card berwarna putih
      clone.style.borderRadius = "8px" // Border radius yang konsisten untuk card
      clone.style.border = "2px solid #000000" // Border yang konsisten
      clone.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)" // Shadow yang subtle

      // Hapus watermark (sesuai permintaan)

      // Append the clone to the wrapper
      wrapper.appendChild(clone)

      // Temporarily append the wrapper to the DOM
      document.body.appendChild(wrapper)

      // Generate the image with higher quality
      const canvas = await html2canvas(wrapper, {
        scale: 3, // Kualitas tinggi tapi tidak terlalu besar
        useCORS: true,
        logging: false,
        backgroundColor: "#f5f5f5", // Warna background yang sesuai dengan proyek
        onclone: (document) => {
          // Find and remove any share buttons in the cloned document
          const shareButtons = document.querySelectorAll(".dom-to-image-button")
          shareButtons.forEach((btn) => btn.parentNode?.removeChild(btn))
        },
      })

      // Remove the wrapper
      document.body.removeChild(wrapper)

      // Convert to data URL
      const dataUrl = canvas.toDataURL("image/png", 1.0)

      // Share or download
      if (navigator.share && navigator.canShare) {
        try {
          // Convert data URL to Blob
          const blob = await (await fetch(dataUrl)).blob()
          const file = new File([blob], `${title}.png`, { type: "image/png" })

          // Share
          await navigator.share({
            title,
            text: shareText,
            files: [file],
          })
        } catch (error) {
          console.error("Error sharing:", error)
          downloadImage(dataUrl, title)
        }
      } else {
        downloadImage(dataUrl, title)
      }
    } catch (error) {
      console.error("Error generating image:", error)
    } finally {
      setIsSharing(false)
    }
  }

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = `${filename}.png`
    link.click()
  }

  const buttonClasses = floating
    ? `dom-to-image-button absolute ${positionClasses[position]} z-10 flex items-center justify-center w-8 h-8 rounded-lg bg-white border-2 border-black ${className}`
    : `dom-to-image-button flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border-2 border-black ${className}`

  return (
    <button onClick={handleShare} disabled={isSharing} className={buttonClasses} aria-label="Share">
      {isSharing ? (
        <div className="h-4 w-4 border-2 border-t-transparent border-black rounded-md animate-spin" />
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          {!floating && <span>Share</span>}
        </>
      )}
    </button>
  )
}
