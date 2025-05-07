"use client"

interface ThemeColors {
  background: string
  border: string
  header: string
  headerText: string
  text: string
  secondaryText: string
  messageBox: string
  footer: string
  footerText: string
  avatarBg: string
}

// Definisikan warna tema yang sesuai dengan proyek
const themeColors: ThemeColors = {
  background: "#fff4e0", // Background proyek dari --bg di globals.css
  border: "#000000", // Border hitam
  header: "#ffffff", // Header putih
  headerText: "#000000", // Teks header hitam
  text: "#000000", // Teks utama hitam
  secondaryText: "#6b7280", // Teks sekunder abu-abu
  messageBox: "#ffffff", // Kotak pesan putih
  footer: "#ffffff", // Footer putih
  footerText: "#000000", // Teks footer hitam
  avatarBg: "#fd9745", // Warna avatar sesuai dengan --main di proyek
}

// Konstanta untuk resolusi dan kualitas
const CANVAS_WIDTH = 1800
const CANVAS_HEIGHT = 945
const EXPORT_QUALITY = 1.0

// Font yang sesuai dengan proyek (font default dari Tailwind CSS)
const PRIMARY_FONT =
  "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

/**
 * Generates a shareable image using a design similar to the animated card on the homepage
 * with dynamic card height based on message length
 */
export async function generateTemplateImage({
  username,
  message,
  date,
  avatarUrl = null,
}: {
  username: string
  message: string
  date: string
  avatarUrl?: string | null
}): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Gunakan warna tema yang sudah didefinisikan
      const colors = themeColors

      // Create high-resolution canvas
      const canvas = document.createElement("canvas")
      canvas.width = CANVAS_WIDTH
      canvas.height = CANVAS_HEIGHT

      const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: false })
      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"

      // Draw background with project's background color
      ctx.fillStyle = colors.background
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Calculate card width (fixed)
      const cardWidth = CANVAS_WIDTH * 0.7
      const cardLeft = (CANVAS_WIDTH - cardWidth) / 2

      // Set up constants for layout
      const padding = 40
      const avatarSize = 80
      const headerHeight = padding * 2 + avatarSize
      const footerHeight = padding * 2 + 50 // Space for button + padding
      const messageLineHeight = 56
      const messageFont = `44px ${PRIMARY_FONT}`

      // Calculate how many lines the message will take
      ctx.font = messageFont
      const messageWidth = cardWidth - padding * 2
      const messageLines = calculateTextLines(ctx, message, messageWidth, 5) // Max 5 lines

      // Calculate the dynamic card height based on message length
      // Minimum height ensures there's always enough space for short messages
      const minContentHeight = 200 // Minimum content height for very short messages
      const contentHeight = Math.max(minContentHeight, messageLines.length * messageLineHeight + padding * 2)

      // Calculate total card height
      const cardHeight = headerHeight + contentHeight + footerHeight
      const cardTop = (CANVAS_HEIGHT - cardHeight) / 2

      // Draw the card (white background with black border)
      ctx.fillStyle = "#ffffff"

      // Tidak perlu shadow blur, hanya offset seperti di UI proyek
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)"
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 4
      ctx.shadowOffsetY = 4

      // Draw rounded rectangle for card
      roundRect(ctx, cardLeft, cardTop, cardWidth, cardHeight, 16, true, false)

      // Reset shadow untuk border
      ctx.shadowColor = "transparent"
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Draw border
      ctx.strokeStyle = colors.border
      ctx.lineWidth = 2 // Sesuaikan ketebalan border dengan UI
      roundRect(ctx, cardLeft, cardTop, cardWidth, cardHeight, 16, false, true)

      // Draw avatar circle
      const avatarX = cardLeft + padding + avatarSize / 2
      const avatarY = cardTop + padding + avatarSize / 2

      ctx.save()
      ctx.beginPath()
      ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2)
      ctx.closePath()

      // Avatar border
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.clip()

      // Fill avatar background with project's main color
      ctx.fillStyle = colors.avatarBg
      ctx.fillRect(avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize)

      if (avatarUrl) {
        // Load and draw avatar image if provided
        const avatarImg = new Image()
        avatarImg.crossOrigin = "anonymous"
        avatarImg.onload = () => {
          ctx.drawImage(avatarImg, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize)
          ctx.restore()
          continueDrawing()
        }
        avatarImg.onerror = () => {
          // Draw fallback if image fails to load
          drawAvatarFallback()
          continueDrawing()
        }
        avatarImg.src = avatarUrl
      } else {
        // Draw fallback avatar
        drawAvatarFallback()
        continueDrawing()
      }

      function drawAvatarFallback() {
        // Gambar background avatar dengan warna tema
        ctx.fillStyle = colors.avatarBg
        ctx.fillRect(avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize)

        // Gambar tanda tanya yang lebih jelas
        ctx.fillStyle = "#ffffff"
        ctx.font = `bold ${avatarSize * 0.6}px ${PRIMARY_FONT}`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("?", avatarX, avatarY)

        // Restore context setelah clipping
        ctx.restore()
      }

      function continueDrawing() {
        // Sesuaikan posisi header content untuk alignment yang lebih baik
        const headerX = avatarX + avatarSize / 2 + padding
        const headerY = cardTop + padding + 10 // Tambahkan sedikit padding atas untuk alignment yang lebih baik

        // Buat avatar dan teks sejajar secara vertikal
        // Gunakan baseline yang konsisten untuk semua teks

        // Draw "Pesan Anonim" text - NOT BOLD as requested
        ctx.fillStyle = "#000000"
        ctx.font = `32px ${PRIMARY_FONT}`
        ctx.textAlign = "left"
        ctx.textBaseline = "top"
        ctx.fillText("Pesan Anonim", headerX, headerY)

        // Draw dot separator - sejajarkan dengan teks "Pesan Anonim"
        ctx.fillText("•", headerX + 200, headerY)

        // Draw date - sejajarkan dengan teks lainnya
        ctx.fillStyle = "#6b7280"
        ctx.font = `28px ${PRIMARY_FONT}`
        ctx.fillText(date, headerX + 230, headerY + 2) // Sedikit penyesuaian untuk ukuran font yang berbeda

        // Sesuaikan posisi "Untuk: @username" agar sejajar dengan avatar
        const usernameY = headerY + 45 // Jarak yang konsisten dari teks di atasnya

        ctx.fillStyle = "#000000"
        ctx.font = `28px ${PRIMARY_FONT}`
        ctx.fillText("Untuk:", headerX, usernameY)

        ctx.fillStyle = "#000000"
        ctx.font = `bold 28px ${PRIMARY_FONT}`
        ctx.fillText(`@${username}`, headerX + 90, usernameY)

        // Draw message content with LARGER text for better readability
        const messageX = cardLeft + padding
        const messageY = cardTop + headerHeight + padding

        ctx.fillStyle = "#000000"
        ctx.font = messageFont
        ctx.textAlign = "left"

        // Draw each line of text
        messageLines.forEach((line, index) => {
          ctx.fillText(line, messageX, messageY + index * messageLineHeight)
        })

        // Draw reply button at the bottom right
        const buttonWidth = 120
        const buttonHeight = 50
        const buttonX = cardLeft + cardWidth - padding - buttonWidth
        const buttonY = cardTop + cardHeight - padding - buttonHeight

        // Button background
        ctx.fillStyle = "#ffffff"

        // Button shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)"
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
        roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 8, true, false)

        // Button border
        ctx.shadowColor = "transparent"
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 2
        roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 8, false, true)

        // Button text
        ctx.fillStyle = "#000000"
        ctx.font = `bold 28px ${PRIMARY_FONT}`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("Balas", buttonX + buttonWidth / 2, buttonY + buttonHeight / 2)

        // Draw SecretMe branding at the bottom
        ctx.fillStyle = "#6b7280"
        ctx.font = `bold 28px ${PRIMARY_FONT}`
        ctx.textAlign = "center"
        ctx.textBaseline = "bottom"
        ctx.fillText("Dibuat dengan SecretMe - Kirim pesan anonim ke temanmu", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30)

        // Convert canvas to data URL with maximum quality
        const dataUrl = canvas.toDataURL("image/png", EXPORT_QUALITY)
        resolve(dataUrl)
      }
    } catch (error) {
      console.error("Error generating template image:", error)
      reject(error)
    }
  })
}

// Helper function to calculate text lines based on width constraints
function calculateTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  // Trim text and handle empty case
  text = text.trim()
  if (!text) {
    return [""]
  }

  const words = text.split(" ")
  const lines: string[] = []
  let currentLine = ""

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word

      // Check if we've reached the maximum number of lines
      if (lines.length >= maxLines - 1) {
        // If this is the last allowed line, we need to handle overflow
        if (i < words.length - 1) {
          // There are more words to come, so we'll add ellipsis
          let lastLine = currentLine

          // Keep adding words until we hit the width limit
          for (let j = i + 1; j < words.length; j++) {
            const testLastLine = `${lastLine} ${words[j]}`
            if (ctx.measureText(`${testLastLine}...`).width <= maxWidth) {
              lastLine = testLastLine
              i = j
            } else {
              break
            }
          }

          lines.push(`${lastLine}...`)
          break
        }
      }
    } else {
      currentLine = testLine
    }
  }

  // Add the last line if there's anything left
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine)
  }

  return lines
}

// Helper function to draw rounded rectangles with improved quality
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: boolean,
  stroke: boolean,
) {
  if (typeof radius === "number") {
    radius = { tl: radius, tr: radius, br: radius, bl: radius }
  } else {
    radius = { ...{ tl: 0, tr: 0, br: 0, bl: 0 }, ...radius }
  }

  ctx.beginPath()
  ctx.moveTo(x + radius.tl, y)
  ctx.lineTo(x + width - radius.tr, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr)
  ctx.lineTo(x + width, y + height - radius.br)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height)
  ctx.lineTo(x + radius.bl, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl)
  ctx.lineTo(x, y + radius.tl)
  ctx.quadraticCurveTo(x, y, x + radius.tl, y)
  ctx.closePath()

  if (fill) {
    ctx.fill()
  }

  if (stroke) {
    ctx.stroke()
  }
}

/**
 * Shares or downloads the generated template image
 */
export async function shareTemplateImage(dataUrl: string, title: string, text: string) {
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
