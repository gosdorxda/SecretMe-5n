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
}

// Definisikan langsung warna tema terang
const themeColors: ThemeColors = {
  background: "#ffffff",
  border: "#000000",
  header: "#fd9745",
  headerText: "#000000",
  text: "#000000",
  secondaryText: "#6b7280",
  messageBox: "#f3f4f6",
  footer: "#fd9745",
  footerText: "#000000",
}

// Konstanta untuk resolusi dan kualitas
const CANVAS_WIDTH = 1800 // Ditingkatkan dari 1200
const CANVAS_HEIGHT = 945 // Ditingkatkan dari 630 (menjaga rasio aspek 1.9:1)
const EXPORT_QUALITY = 1.0 // Kualitas maksimum untuk ekspor PNG

// Font yang lebih baik untuk rendering teks
const PRIMARY_FONT = "'Segoe UI', Arial, sans-serif"
const HEADER_FONT = "bold 72px " + PRIMARY_FONT // Ditingkatkan dari 48px
const USERNAME_FONT = "bold 54px " + PRIMARY_FONT // Ditingkatkan dari 36px
const DATE_FONT = "36px " + PRIMARY_FONT // Ditingkatkan dari 24px
const MESSAGE_FONT = "42px " + PRIMARY_FONT // Ditingkatkan dari 28px
const FOOTER_FONT = "bold 36px " + PRIMARY_FONT // Ditingkatkan dari 24px

/**
 * Generates a shareable image using a fixed template and dynamic content
 * with improved resolution and quality
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
      // Gunakan warna tema terang yang sudah didefinisikan
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

      // Draw background with slight gradient for more depth
      const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
      bgGradient.addColorStop(0, colors.background)
      bgGradient.addColorStop(1, "#f8f8f8") // Slightly darker at bottom for depth
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Add border with shadow effect
      ctx.strokeStyle = colors.border
      ctx.lineWidth = 12 // Increased from 8
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)"
      ctx.shadowBlur = 15
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 4
      ctx.strokeRect(6, 6, CANVAS_WIDTH - 12, CANVAS_HEIGHT - 12)

      // Reset shadow for other elements
      ctx.shadowColor = "transparent"
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Draw header background with gradient
      const headerGradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0)
      headerGradient.addColorStop(0, colors.header)
      headerGradient.addColorStop(1, "#ffb067") // Slightly lighter for gradient effect
      ctx.fillStyle = headerGradient
      ctx.fillRect(0, 0, CANVAS_WIDTH, 180) // Increased from 120

      // Draw SecretMe logo/header with shadow for depth
      ctx.fillStyle = colors.headerText
      ctx.font = HEADER_FONT
      ctx.textAlign = "left"
      ctx.shadowColor = "rgba(0, 0, 0, 0.2)"
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      ctx.fillText("SecretMe", 60, 120) // Adjusted position

      // Reset shadow
      ctx.shadowColor = "transparent"
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Draw avatar placeholder or image
      ctx.save()
      ctx.beginPath()
      const avatarX = 150 // Adjusted from 100
      const avatarY = 300 // Adjusted from 200
      const avatarRadius = 75 // Increased from 50
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2)
      ctx.closePath()

      // Add avatar border
      ctx.strokeStyle = "#e0e0e0"
      ctx.lineWidth = 4
      ctx.stroke()

      ctx.clip()

      if (avatarUrl) {
        // Load and draw avatar image if provided
        const avatarImg = new Image()
        avatarImg.crossOrigin = "anonymous"
        avatarImg.onload = () => {
          // Draw with high quality
          ctx.drawImage(avatarImg, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2)
          ctx.restore()
          finishDrawing()
        }
        avatarImg.onerror = () => {
          // Draw fallback if image fails to load
          drawAvatarFallback()
          finishDrawing()
        }
        avatarImg.src = avatarUrl
      } else {
        // Draw fallback avatar
        drawAvatarFallback()
        finishDrawing()
      }

      function drawAvatarFallback() {
        // Create gradient for avatar background
        const avatarGradient = ctx.createRadialGradient(avatarX, avatarY, 0, avatarX, avatarY, avatarRadius)
        avatarGradient.addColorStop(0, "#f0f0f0")
        avatarGradient.addColorStop(1, "#e5e7eb")

        ctx.fillStyle = avatarGradient
        ctx.fillRect(avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2)
        ctx.restore()

        // Draw avatar text (first letter of username) with better styling
        ctx.fillStyle = "#6b7280"
        ctx.font = "bold 60px " + PRIMARY_FONT // Increased from 40px
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(username.charAt(0).toUpperCase(), avatarX, avatarY)
      }

      function finishDrawing() {
        // Draw username with shadow for better readability
        ctx.fillStyle = colors.text
        ctx.font = USERNAME_FONT
        ctx.textAlign = "left"
        ctx.textBaseline = "top"
        ctx.shadowColor = "rgba(0, 0, 0, 0.1)"
        ctx.shadowBlur = 2
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1
        ctx.fillText(`@${username}`, 270, 270) // Adjusted from 180, 180

        // Reset shadow
        ctx.shadowColor = "transparent"
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

        // Draw date
        ctx.fillStyle = colors.secondaryText
        ctx.font = DATE_FONT
        ctx.fillText(date, 270, 340) // Adjusted from 180, 225

        // Draw message box with rounded corners and subtle shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.1)"
        ctx.shadowBlur = 10
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 4
        ctx.fillStyle = colors.messageBox
        roundRect(ctx, 60, 420, CANVAS_WIDTH - 120, 375, 24, true, false) // Adjusted size and position

        // Reset shadow
        ctx.shadowColor = "transparent"
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

        // Draw message with improved text rendering
        ctx.fillStyle = colors.text
        ctx.font = MESSAGE_FONT
        ctx.textAlign = "left"
        wrapText(ctx, message, 90, 480, CANVAS_WIDTH - 180, 54) // Adjusted parameters

        // Draw footer with gradient
        const footerGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - 120, CANVAS_WIDTH, CANVAS_HEIGHT - 120)
        footerGradient.addColorStop(0, colors.footer)
        footerGradient.addColorStop(1, "#ffb067") // Slightly lighter for gradient effect
        ctx.fillStyle = footerGradient
        ctx.fillRect(0, CANVAS_HEIGHT - 120, CANVAS_WIDTH, 120) // Increased from 80

        // Draw footer text with shadow for better readability
        ctx.fillStyle = colors.footerText
        ctx.font = FOOTER_FONT
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)"
        ctx.shadowBlur = 2
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1
        ctx.fillText("Dibuat dengan SecretMe - Kirim pesan anonim ke temanmu", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60)

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
      // Apply slight shadow for better text readability
      ctx.shadowColor = "rgba(0, 0, 0, 0.05)"
      ctx.shadowBlur = 1
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 1

      ctx.fillText(line, x, y + lineCount * lineHeight)

      // Reset shadow
      ctx.shadowColor = "transparent"
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

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

        // Apply slight shadow for better text readability
        ctx.shadowColor = "rgba(0, 0, 0, 0.05)"
        ctx.shadowBlur = 1
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 1

        ctx.fillText(lastLine, x, y + lineCount * lineHeight)

        // Reset shadow
        ctx.shadowColor = "transparent"
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

        break
      }
    } else {
      line = testLine
    }
  }

  // Draw the last line if we haven't exceeded the line limit
  if (lineCount < 5) {
    // Apply slight shadow for better text readability
    ctx.shadowColor = "rgba(0, 0, 0, 0.05)"
    ctx.shadowBlur = 1
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 1

    ctx.fillText(line, x, y + lineCount * lineHeight)

    // Reset shadow
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
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
