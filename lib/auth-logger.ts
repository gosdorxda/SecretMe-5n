// Tipe data untuk log auth
export type AuthLogEntry = {
  timestamp: number
  endpoint: string
  method: string
  source: "client" | "server" | "middleware"
  success: boolean
  duration: number
  cached: boolean
  userId?: string
  error?: string
  userAgent?: string
  ip?: string
  details?: any
}

// Menyimpan log dalam memori (untuk development)
const inMemoryLogs: AuthLogEntry[] = []
const MAX_IN_MEMORY_LOGS = 1000

// Fungsi untuk mendeteksi perangkat mobile
function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Fungsi untuk mencatat log auth
export function logAuthRequest(data: {
  endpoint: string
  method: string
  source: "client" | "server" | "middleware"
  success: boolean
  duration: number
  cached: boolean
  userId?: string
  error?: string
  details?: Record<string, any>
}) {
  // Tambahkan deteksi mobile jika tidak ada di details
  if (data.details && !("isMobile" in data.details)) {
    data.details.isMobile = isMobileDevice()
  }

  // Tambahkan prefix untuk mobile
  const mobilePrefix = data.details?.isMobile ? "📱 " : ""

  // Format log message
  const timestamp = new Date().toISOString()
  const cachedIndicator = data.cached ? "🔄 [CACHED] " : " "
  const statusIndicator = data.success ? "✅" : "❌"
  const durationText = data.duration > 0 ? `${data.duration}ms` : "-"
  const userIdText = data.userId ? `| User: ${data.userId}` : ""
  const errorText = data.error ? `| Error: ${data.error}` : ""

  // Log ke console
  console.log(
    `🔐 AUTH ${statusIndicator} [${data.source.toUpperCase()}] ${mobilePrefix}${cachedIndicator}${timestamp} | ${data.method} ${data.endpoint} | ${durationText} ${userIdText} ${errorText}`,
  )

  // Tambahkan ke log history
  if (typeof window !== "undefined") {
    try {
      // Simpan log ke localStorage untuk debugging
      const logs = JSON.parse(localStorage.getItem("auth_logs") || "[]")
      logs.push({
        ...data,
        timestamp,
        isMobile: data.details?.isMobile || isMobileDevice(),
      })

      // Batasi jumlah log
      if (logs.length > 100) {
        logs.shift()
      }

      localStorage.setItem("auth_logs", JSON.stringify(logs))
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

// Fungsi untuk mendapatkan log terbaru
export function getRecentAuthLogs(limit = 100): AuthLogEntry[] {
  return inMemoryLogs.slice(0, limit)
}

// Fungsi untuk menghitung statistik auth
export function getAuthStats() {
  const now = Date.now()
  const last5Minutes = now - 5 * 60 * 1000
  const lastHour = now - 60 * 60 * 1000
  const last24Hours = now - 24 * 60 * 60 * 1000

  const logs5Min = inMemoryLogs.filter((log) => log.timestamp > last5Minutes)
  const logsHour = inMemoryLogs.filter((log) => log.timestamp > lastHour)
  const logs24Hours = inMemoryLogs.filter((log) => log.timestamp > last24Hours)

  return {
    last5Minutes: {
      total: logs5Min.length,
      success: logs5Min.filter((log) => log.success).length,
      failed: logs5Min.filter((log) => !log.success).length,
      cached: logs5Min.filter((log) => log.cached).length,
      avgDuration: logs5Min.length
        ? Math.round(logs5Min.reduce((sum, log) => sum + log.duration, 0) / logs5Min.length)
        : 0,
    },
    lastHour: {
      total: logsHour.length,
      success: logsHour.filter((log) => log.success).length,
      failed: logsHour.filter((log) => !log.success).length,
      cached: logsHour.filter((log) => log.cached).length,
      avgDuration: logsHour.length
        ? Math.round(logsHour.reduce((sum, log) => sum + log.duration, 0) / logsHour.length)
        : 0,
    },
    last24Hours: {
      total: logs24Hours.length,
      success: logs24Hours.filter((log) => log.success).length,
      failed: logs24Hours.filter((log) => !log.success).length,
      cached: logs24Hours.filter((log) => log.cached).length,
      avgDuration: logs24Hours.length
        ? Math.round(logs24Hours.reduce((sum, log) => sum + log.duration, 0) / logs24Hours.length)
        : 0,
    },
    byEndpoint: getEndpointStats(inMemoryLogs),
    bySource: getSourceStats(inMemoryLogs),
  }
}

// Helper untuk mendapatkan statistik berdasarkan endpoint
function getEndpointStats(logs: AuthLogEntry[]) {
  const stats: Record<string, { count: number; success: number; failed: number }> = {}

  logs.forEach((log) => {
    const key = `${log.method} ${log.endpoint}`
    if (!stats[key]) {
      stats[key] = { count: 0, success: 0, failed: 0 }
    }
    stats[key].count++
    if (log.success) stats[key].success++
    else stats[key].failed++
  })

  return stats
}

// Helper untuk mendapatkan statistik berdasarkan sumber
function getSourceStats(logs: AuthLogEntry[]) {
  const stats: Record<string, { count: number; success: number; failed: number }> = {}

  logs.forEach((log) => {
    const source = log.source
    if (!stats[source]) {
      stats[source] = { count: 0, success: 0, failed: 0 }
    }
    stats[source].count++
    if (log.success) stats[source].success++
    else stats[source].failed++
  })

  return stats
}

// Fungsi untuk membersihkan log
export function clearAuthLogs() {
  inMemoryLogs.length = 0
}
