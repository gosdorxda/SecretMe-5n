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
  // Format log message
  const timestamp = new Date().toISOString()
  const cachedIndicator = data.cached ? "🔄 [CACHED] " : " "
  const statusIndicator = data.success ? "���" : "❌"
  const durationText = data.duration > 0 ? `${data.duration}ms` : "-"
  const userIdText = data.userId ? `| User: ${data.userId}` : ""
  const errorText = data.error ? `| Error: ${data.error}` : ""

  // Log ke console
  console.log(
    `🔐 AUTH ${statusIndicator} [${data.source.toUpperCase()}] ${cachedIndicator}${timestamp} | ${data.method} ${data.endpoint} | ${durationText} ${userIdText} ${errorText}`,
  )

  // Tambahkan ke log history
  if (typeof window !== "undefined") {
    try {
      // Simpan log ke localStorage untuk debugging
      const logs = JSON.parse(localStorage.getItem("auth_logs") || "[]")
      logs.push({
        ...data,
        timestamp,
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

  // Tambahkan ke in-memory logs
  inMemoryLogs.push({
    ...data,
    timestamp: Date.now(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  })

  // Batasi jumlah log dalam memori
  if (inMemoryLogs.length > MAX_IN_MEMORY_LOGS) {
    inMemoryLogs.shift()
  }
}

// Fungsi untuk mendapatkan log terbaru
export function getRecentAuthLogs(limit = 100): AuthLogEntry[] {
  return inMemoryLogs.slice(0, limit)
}

// Fungsi untuk membersihkan log
export function clearAuthLogs() {
  inMemoryLogs.length = 0

  // Juga bersihkan localStorage jika tersedia
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("auth_logs")
    } catch (e) {
      // Ignore localStorage errors
    }
  }
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
    if (log.success) {
      stats[key].success++
    } else {
      stats[key].failed++
    }
  })

  return Object.entries(stats)
    .sort(([, a], [, b]) => b.count - a.count)
    .reduce((obj: Record<string, { count: number; success: number; failed: number }>, [key, value]) => {
      obj[key] = value
      return obj
    }, {})
}

// Helper untuk mendapatkan statistik berdasarkan source
function getSourceStats(logs: AuthLogEntry[]) {
  const stats: Record<string, { count: number; success: number; failed: number }> = {}

  logs.forEach((log) => {
    const key = log.source
    if (!stats[key]) {
      stats[key] = { count: 0, success: 0, failed: 0 }
    }
    stats[key].count++
    if (log.success) {
      stats[key].success++
    } else {
      stats[key].failed++
    }
  })

  return Object.entries(stats)
    .sort(([, a], [, b]) => b.count - a.count)
    .reduce((obj: Record<string, { count: number; success: number; failed: number }>, [key, value]) => {
      obj[key] = value
      return obj
    }, {})
}
