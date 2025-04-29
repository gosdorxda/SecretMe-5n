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
 * but with project's background and font
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

      // Calculate card dimensions (centered in canvas)
      const cardWidth = CANVAS_WIDTH * 0.8
      const cardHeight = CANVAS_HEIGHT * 0.7
      const cardLeft = (CANVAS_WIDTH - cardWidth) / 2
      const cardTop = (CANVAS_HEIGHT - cardHeight) / 2

      // Draw the card (white background with black border)
      ctx.fillStyle = "#ffffff"
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)"
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 4
      ctx.shadowOffsetY = 4

      // Draw rounded rectangle for card
      roundRect(ctx, cardLeft, cardTop, cardWidth, cardHeight, 16, true, false)

      // Draw border
      ctx.shadowColor = "transparent"
      ctx.strokeStyle = colors.border
      ctx.lineWidth = 6
      roundRect(ctx, cardLeft, cardTop, cardWidth, cardHeight, 16, false, true)

      // Calculate positions relative to the card
      const padding = 40

      // Draw avatar circle
      const avatarSize = 96
      const avatarX = cardLeft + padding + avatarSize / 2
      const avatarY = cardTop + padding + avatarSize / 2

      ctx.save()
      ctx.beginPath()
      ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2)
      ctx.closePath()

      // Avatar border
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 4
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
        // Draw avatar text (first letter of username)
        ctx.fillStyle = "#ffffff"
        ctx.font = `bold ${avatarSize * 0.5}px ${PRIMARY_FONT}`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(username.charAt(0).toUpperCase(), avatarX, avatarY)
        ctx.restore()
      }

      function continueDrawing() {
        // Draw header content
        const headerX = avatarX + avatarSize / 2 + padding
        const headerY = cardTop + padding

        // Draw "Pesan Anonim" text - NOT BOLD as requested
        ctx.fillStyle = "#000000"
        ctx.font = `36px ${PRIMARY_FONT}` // Using project's font, not bold
        ctx.textAlign = "left"
        ctx.textBaseline = "top"
        ctx.fillText("Pesan Anonim", headerX, headerY)

        // Draw dot separator
        ctx.fillText("•", headerX + 220, headerY)

        // Draw date
        ctx.fillStyle = "#6b7280"
        ctx.font = `32px ${PRIMARY_FONT}` // Using project's font
        ctx.fillText(date, headerX + 250, headerY)

        // Draw "Untuk: @username" text
        ctx.fillStyle = "#000000"
        ctx.font = `32px ${PRIMARY_FONT}` // Using project's font
        ctx.fillText("Untuk:", headerX, headerY + 50)

        ctx.fillStyle = "#000000"
        ctx.font = `bold 32px ${PRIMARY_FONT}` // Using project's font, bold
        ctx.fillText(`@${username}`, headerX + 100, headerY + 50)

        // Draw message content
        const messageX = cardLeft + padding
        const messageY = cardTop + padding * 3 + avatarSize / 2
        const messageWidth = cardWidth - padding * 2

        ctx.fillStyle = "#000000"
        ctx.font = `36px ${PRIMARY_FONT}` // Using project's font
        ctx.textAlign = "left"
        wrapText(ctx, message, messageX, messageY, messageWidth, 48)

        // Draw footer with reply button
        const footerY = cardTop + cardHeight - padding - 50

        // Draw reply button
        const buttonWidth = 120
        const buttonHeight = 50
        const buttonX = cardLeft + cardWidth - padding - buttonWidth
        const buttonY = footerY

        // Button background
        ctx.fillStyle = "#ffffff"
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)"
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
        roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 8, true, false)

        // Button border
        ctx.shadowColor = "transparent"
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 4
        roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 8, false, true)

        // Button text
        ctx.fillStyle = "#000000"
        ctx.font = `bold 28px ${PRIMARY_FONT}` // Using project's font, bold
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("Balas", buttonX + buttonWidth / 2, buttonY + buttonHeight / 2)

        // Draw SecretMe branding at the bottom
        ctx.fillStyle = "#6b7280"
        ctx.font = `bold 28px ${PRIMARY_FONT}` // Using project's font, bold
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

// Helper function to wrap text with improved quality
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  // Trim text and handle empty case
  text = text.trim()
  if (!text) {
    return
  }

  const words = text.split(" ")
  let line = ""
  let testLine = ""
  let lineCount = 0

  for (let n = 0; n < words.length; n++) {
    testLine = line + words[n] + " "
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y + lineCount * lineHeight)
      line = words[n] + " "
      lineCount++

      // Limit to 5 lines and add ellipsis if needed
      if (lineCount >= 5 && n < words.length - 1) {
        // Get the current line with ellipsis
        let lastLine = line.trim() + "..."

        // Check if the last line with ellipsis is too long
        if (ctx.measureText(lastLine).width > maxWidth) {
          // Remove words until it fits
          const lastWords = line.trim().split(" ")
          lastLine = ""
          for (let i = 0; i < lastWords.length; i++) {
            const testLastLine = lastLine + lastWords[i] + " "
            if (ctx.measureText(testLastLine + "...").width <= maxWidth) {
              lastLine = testLastLine
            } else {
              break
            }
          }
          lastLine = lastLine.trim() + "..."
        }

        ctx.fillText(lastLine, x, y + lineCount * lineHeight)
        break
      }
    } else {
      line = testLine
    }
  }

  // Draw the last line if we haven't exceeded the line limit
  if (lineCount < 5) {
    ctx.fillText(line, x, y + lineCount * lineHeight)
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
