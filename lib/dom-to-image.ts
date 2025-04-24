"use client"

import html2canvas from "html2canvas"

// Ubah fungsi generateImageFromElement untuk menghasilkan gambar dengan spesifikasi yang diminta

export async function generateImageFromElement(element: HTMLElement): Promise<string | null> {
  try {
    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement

    // Create a wrapper with padding
    const wrapper = document.createElement("div")
    wrapper.style.position = "absolute"
    wrapper.style.left = "-9999px"
    wrapper.style.padding = "80px" // Tambah padding yang lebih besar (80px) di sekitar elemen
    wrapper.style.backgroundColor = "#f5f5f5" // Warna background yang sesuai dengan proyek
    wrapper.style.display = "inline-block"
    wrapper.style.borderRadius = "0px" // Hapus border radius pada wrapper
    wrapper.style.boxShadow = "none" // Hapus shadow pada wrapper

    // Append the clone to the wrapper
    wrapper.appendChild(clone)

    // Temporarily append the wrapper to the DOM
    document.body.appendChild(wrapper)

    // Make sure the clone has the same dimensions as the original
    clone.style.width = `${element.offsetWidth}px`
    clone.style.height = `${element.offsetHeight}px`
    clone.style.backgroundColor = "white" // Pastikan card berwarna putih
    clone.style.borderRadius = "8px" // Border radius yang konsisten untuk card
    clone.style.border = "2px solid #000000" // Border yang konsisten
    clone.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)" // Shadow yang subtle

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

    // Hapus watermark (sesuai permintaan)

    // Generate the image with higher quality
    const canvas = await html2canvas(wrapper, {
      scale: 3, // Kualitas tinggi tapi tidak terlalu besar
      useCORS: true, // Enable CORS for images
      allowTaint: true,
      backgroundColor: "#f5f5f5", // Warna background yang sesuai dengan proyek
      logging: false,
      onclone: (document) => {
        // Find and remove any share buttons in the cloned document
        const shareButtons = document.querySelectorAll(".share-button, .dom-to-image-button")
        shareButtons.forEach((btn) => btn.parentNode?.removeChild(btn))
      },
    })

    // Remove the wrapper from the DOM
    document.body.removeChild(wrapper)

    return canvas.toDataURL("image/png", 1.0) // Use maximum quality
  } catch (error) {
    console.error("Error generating image:", error)
    return null
  }
}

/**
 * Shares or downloads an image
 */
export async function shareImage(dataUrl: string, title: string, text: string) {
  // Create a blob from the data URL
  const blob = await (await fetch(dataUrl)).blob()

  // Try to use the Web Share API if available
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], `${title.replace(/\s+/g, "-")}.png`, { type: "image/png" })

    const shareData = {
      title,
      text,
      files: [file],
    }

    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error)
        }
      }
    }
  }

  // Fallback to download if sharing is not available or failed
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = `${title.replace(/\s+/g, "-")}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
