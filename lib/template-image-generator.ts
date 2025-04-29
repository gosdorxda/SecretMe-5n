"use client"

// Tidak perlu lagi tipe TemplateTheme karena hanya ada satu tema
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

/**
 * Generates a shareable image using a fixed template and dynamic content
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

      // Create canvas
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      // Set canvas dimensions
      canvas.width = 1200
      canvas.height = 630

      // Draw background
      ctx.fillStyle = colors.background
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add border
      ctx.strokeStyle = colors.border
      ctx.lineWidth = 8
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8)

      // Draw header background
      ctx.fillStyle = colors.header
      ctx.fillRect(0, 0, canvas.width, 120)

      // Draw SecretMe logo/header
      ctx.fillStyle = colors.headerText
      ctx.font = "bold 48px Arial, sans-serif"
      ctx.textAlign = "left"
      ctx.fillText("SecretMe", 40, 80)

      // Draw avatar placeholder or image
      ctx.save()
      ctx.beginPath()
      const avatarX = 100
      const avatarY = 200
      const avatarRadius = 50
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()

      if (avatarUrl) {
        // Load and draw avatar image if provided
        const avatarImg = new Image()
        avatarImg.crossOrigin = "anonymous"
        avatarImg.onload = () => {
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
        // Warna fallback untuk avatar
        ctx.fillStyle = "#e5e7eb"
        ctx.fillRect(avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2)
        ctx.restore()

        // Draw avatar text (first letter of username)
        ctx.fillStyle = "#6b7280"
        ctx.font = "bold 40px Arial, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(username.charAt(0).toUpperCase(), avatarX, avatarY)
      }

      function finishDrawing() {
        // Draw username
        ctx.fillStyle = colors.text
        ctx.font = "bold 36px Arial, sans-serif"
        ctx.textAlign = "left"
        ctx.textBaseline = "top"
        ctx.fillText(`@${username}`, 180, 180)

        // Draw date
        ctx.fillStyle = colors.secondaryText
        ctx.font = "24px Arial, sans-serif"
        ctx.fillText(date, 180, 225)

        // Draw message box
        ctx.fillStyle = colors.messageBox
        roundRect(ctx, 40, 280, canvas.width - 80, 250, 16, true, false)

        // Draw message
        ctx.fillStyle = colors.text
        ctx.font = "28px Arial, sans-serif"
        ctx.textAlign = "left"
        wrapText(ctx, message, 60, 320, canvas.width - 120, 36)

        // Draw footer with SecretMe branding
        ctx.fillStyle = colors.footer
        ctx.fillRect(0, canvas.height - 80, canvas.width, 80)

        // Draw footer text
        ctx.fillStyle = colors.footerText
        ctx.font = "bold 24px Arial, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("Dibuat dengan SecretMe - Kirim pesan anonim ke temanmu", canvas.width / 2, canvas.height - 40)

        // Convert canvas to data URL and resolve
        const dataUrl = canvas.toDataURL("image/png", 1.0)
        resolve(dataUrl)
      }
    } catch (error) {
      console.error("Error generating template image:", error)
      reject(error)
    }
  })
}

// Helper function to draw rounded rectangles
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
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
  if (fill) {
    ctx.fill()
  }
  if (stroke) {
    ctx.stroke()
  }
}

// Helper function to wrap text
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
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
