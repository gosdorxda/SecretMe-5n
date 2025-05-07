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

// Konstanta untuk resolusi dan kualitas - UKURAN DIKECILKAN
const CANVAS_WIDTH = 720
const CANVAS_HEIGHT = 378 // Mempertahankan rasio aspek yang sama (720 / 1800 * 945)
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
  displayName = "",
}: {
  username: string
  message: string
  date: string
  avatarUrl?: string | null
  displayName?: string
}): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Gunakan warna tema yang sudah didefinisikan
      const colors = themeColors

      // Create canvas with smaller dimensions
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

      // Calculate card width (fixed) - Sesuaikan dengan ukuran canvas baru
      const cardWidth = CANVAS_WIDTH * 0.7
      const cardLeft = (CANVAS_WIDTH - cardWidth) / 2

      // Set up constants for layout - Sesuaikan dengan ukuran canvas baru
      const padding = 16 // Dikurangi dari 40
      const avatarSize = 32 // Dikurangi dari 80
      const headerHeight = padding * 2 + avatarSize - 6 // Disesuaikan
      const footerHeight = padding * 2 + 20 // Disesuaikan
      const messageLineHeight = 22 // Dikurangi dari 56
      const messageFont = `18px ${PRIMARY_FONT}` // Dikurangi dari 44px

      // Calculate how many lines the message will take
      ctx.font = messageFont
      const messageWidth = cardWidth - padding * 2
      const messageLines = calculateTextLines(ctx, message, messageWidth, 5) // Max 5 lines

      // Calculate the dynamic card height based on message length
      // Minimum height ensures there's always enough space for short messages
      const minContentHeight = 80 // Disesuaikan dari 200
      const contentHeight = Math.max(minContentHeight, messageLines.length * messageLineHeight + padding * 2)

      // Calculate total card height
      const cardHeight = headerHeight + contentHeight + footerHeight
      const cardTop = (CANVAS_HEIGHT - cardHeight) / 2

      // Draw the card (white background with black border)
      ctx.fillStyle = colors.messageBox

      // Sesuaikan shadow agar lebih tebal dan selaras dengan proyek
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)"
      ctx.shadowBlur = 1 // Dikurangi dari 2
      ctx.shadowOffsetX = 2 // Dikurangi dari 6
      ctx.shadowOffsetY = 2 // Dikurangi dari 6

      // Draw rounded rectangle for card
      roundRect(ctx, cardLeft, cardTop, cardWidth, cardHeight, 8, true, false) // Radius dikurangi dari 16

      // Reset shadow untuk border
      ctx.shadowColor = "transparent"
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Draw border
      ctx.strokeStyle = colors.border
      ctx.lineWidth = 2 // Dikurangi dari 4
      roundRect(ctx, cardLeft, cardTop, cardWidth, cardHeight, 8, false, true)

      // Naikkan posisi avatar agar sejajar dengan teks
      const avatarX = cardLeft + padding + avatarSize / 2
      const avatarY = cardTop + padding + avatarSize / 2 - 2 // Disesuaikan

      ctx.save()
      ctx.beginPath()
      ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2)
      ctx.closePath()

      // Avatar border - TEBALKAN
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2 // Dikurangi dari 5
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
        // Tambahkan jarak antara avatar dan teks
        const headerX = avatarX + avatarSize / 2 + padding * 0.75 // Tambah jarak menjadi 75% dari padding
        const headerY = cardTop + padding // Posisi baris pertama

        // Buat avatar dan teks sejajar secara vertikal
        // Gunakan baseline yang konsisten untuk semua teks

        // Draw "Pesan Anonim" text - NOT BOLD as requested
        ctx.fillStyle = "#000000"
        ctx.font = `13px ${PRIMARY_FONT}` // Dikurangi dari 32px
        ctx.textAlign = "left"
        ctx.textBaseline = "top"
        ctx.fillText("Pesan Anonim", headerX, headerY)

        // Hapus titik pemisah dan tanggal

        // Sesuaikan posisi "Untuk: @username" agar sejajar dengan avatar
        const usernameY = headerY + 18 // Disesuaikan dari 45

        ctx.fillStyle = "#000000"
        ctx.font = `11px ${PRIMARY_FONT}` // Dikurangi dari 28px
        ctx.fillText("Untuk:", headerX, usernameY)

        // Tambahkan spasi setelah "Untuk:"
        ctx.fillStyle = "#000000"
        ctx.font = `bold 11px ${PRIMARY_FONT}` // Dikurangi dari 28px
        const usernameText = `@${username}`
        ctx.fillText(usernameText, headerX + 36, usernameY) // Disesuaikan dari 90

        // Tambahkan nama pengguna jika tersedia
        if (displayName) {
          const usernameWidth = ctx.measureText(usernameText).width
          ctx.fillStyle = "#000000"
          ctx.font = `11px ${PRIMARY_FONT}` // Font biasa (tidak tebal)
          ctx.fillText(`(${displayName})`, headerX + 40 + usernameWidth, usernameY) // Disesuaikan dari 100
        }

        // Draw message content with LARGER text for better readability
        // Kurangi jarak vertikal antara header dan konten pesan
        const messageX = cardLeft + padding
        const messageY = cardTop + headerHeight + padding - 2 // Disesuaikan dari -5

        ctx.fillStyle = "#000000"
        ctx.font = messageFont
        ctx.textAlign = "left"

        // Draw each line of text
        messageLines.forEach((line, index) => {
          ctx.fillText(line, messageX, messageY + index * messageLineHeight)
        })

        // Draw reply button at the bottom right
        const buttonWidth = 48 // Dikurangi dari 120
        const buttonHeight = 20 // Dikurangi dari 50
        const buttonX = cardLeft + cardWidth - padding - buttonWidth
        const buttonY = cardTop + cardHeight - padding - buttonHeight

        // Button background
        ctx.fillStyle = "#ffffff"

        // Button shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)"
        ctx.shadowBlur = 1
        ctx.shadowOffsetX = 1 // Dikurangi dari 3
        ctx.shadowOffsetY = 1 // Dikurangi dari 3
        roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 4, true, false) // Radius dikurangi dari 8

        // Button border
        ctx.shadowColor = "transparent"
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 1 // Dikurangi dari 3
        roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 4, false, true)

        // Button text
        ctx.fillStyle = "#000000"
        ctx.font = `bold 11px ${PRIMARY_FONT}` // Dikurangi dari 28px
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("Balas", buttonX + buttonWidth / 2, buttonY + buttonHeight / 2)

        // Draw SecretMe branding at the bottom
        ctx.fillStyle = "#6b7280"
        ctx.font = `bold 11px ${PRIMARY_FONT}` // Dikurangi dari 28px
        ctx.textAlign = "center"
        ctx.textBaseline = "bottom"
        ctx.fillText("Dibuat dengan SecretMe - Kirim pesan anonim ke temanmu", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12) // Disesuaikan dari 30

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

// Ubah fungsi generateProfileImage dengan yang lebih sederhana dan mirip dengan template pesan

/**
 * Generates a shareable profile image with user profile information
 * with a simple design matching the message template
 */
export async function generateProfileImage({
  username,
  displayName = "",
  bio = "",
  avatarUrl = null,
  profileUrl = "",
}: {
  username: string
  displayName?: string
  bio?: string
  avatarUrl?: string | null
  isPremium?: boolean
  profileUrl?: string
}): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas
      const canvas = document.createElement("canvas")
      canvas.width = CANVAS_WIDTH
      canvas.height = CANVAS_HEIGHT

      const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: false })
      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      // Enable image smoothing
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"

      // Draw background with project's background color
      ctx.fillStyle = themeColors.background
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Calculate card width (fixed) - Sama dengan template pesan
      const cardWidth = CANVAS_WIDTH * 0.7
      const cardLeft = (CANVAS_WIDTH - cardWidth) / 2

      // Set up constants for layout
      const padding = 16
      const avatarSize = 60 // Ukuran avatar lebih besar
      const headerHeight = 20
      const footerHeight = padding * 2 + 20
      const contentHeight = 180 // Tinggi konten tetap

      // Calculate total card height
      const cardHeight = headerHeight + contentHeight + footerHeight
      const cardTop = (CANVAS_HEIGHT - cardHeight) / 2

      // Draw the card (white background with black border)
      ctx.fillStyle = themeColors.messageBox

      // Card shadow - sama dengan template pesan
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)"
      ctx.shadowBlur = 1
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      roundRect(ctx, cardLeft, cardTop, cardWidth, cardHeight, 8, true, false)

      // Reset shadow untuk border
      ctx.shadowColor = "transparent"
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Draw border
      ctx.strokeStyle = themeColors.border
      ctx.lineWidth = 2
      roundRect(ctx, cardLeft, cardTop, cardWidth, cardHeight, 8, false, true)

      // Position avatar in center
      const avatarX = cardLeft + cardWidth / 2
      const avatarY = cardTop + headerHeight + padding + avatarSize / 2

      // Draw avatar circle
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
      ctx.fillStyle = themeColors.avatarBg
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
          drawAvatarFallback()
          continueDrawing()
        }
        avatarImg.src = avatarUrl
      } else {
        drawAvatarFallback()
        continueDrawing()
      }

      function drawAvatarFallback() {
        // Draw avatar background
        ctx.fillStyle = themeColors.avatarBg
        ctx.fillRect(avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize)

        // Draw initial or placeholder
        ctx.fillStyle = "#ffffff"
        ctx.font = `bold ${avatarSize * 0.4}px ${PRIMARY_FONT}`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(displayName ? displayName.charAt(0).toUpperCase() : "?", avatarX, avatarY)

        ctx.restore()
      }

      function continueDrawing() {
        // Draw display name
        const nameY = avatarY + avatarSize / 2 + 25
        ctx.fillStyle = "#000000"
        ctx.font = `bold 18px ${PRIMARY_FONT}`
        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.fillText(displayName || "Nama Pengguna", cardLeft + cardWidth / 2, nameY)

        // Draw username
        const usernameY = nameY + 25
        ctx.fillStyle = "#6b7280"
        ctx.font = `14px ${PRIMARY_FONT}`
        ctx.fillText(`@${username}`, cardLeft + cardWidth / 2, usernameY)

        // Draw CTA button
        const buttonY = usernameY + 40
        const buttonWidth = 200
        const buttonHeight = 36
        const buttonX = cardLeft + cardWidth / 2 - buttonWidth / 2

        // Button background
        ctx.fillStyle = "#fd9745" // Main color

        // Button shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)"
        ctx.shadowBlur = 1
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1
        roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 18, true, false)

        // Reset shadow
        ctx.shadowColor = "transparent"
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

        // Button border
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 1
        roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 18, false, true)

        // Button text
        ctx.fillStyle = "#ffffff"
        ctx.font = `bold 14px ${PRIMARY_FONT}`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("Kirimi Saya Pesan Anonim", buttonX + buttonWidth / 2, buttonY + buttonHeight / 2)

        // Draw SecretMe branding at the bottom
        ctx.fillStyle = "#6b7280"
        ctx.font = `bold 11px ${PRIMARY_FONT}`
        ctx.textAlign = "center"
        ctx.textBaseline = "bottom"
        ctx.fillText("Dibuat dengan SecretMe - Kirim pesan anonim ke temanmu", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12)

        // Convert canvas to data URL with maximum quality
        const dataUrl = canvas.toDataURL("image/png", EXPORT_QUALITY)
        resolve(dataUrl)
      }
    } catch (error) {
      console.error("Error generating profile image:", error)
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
