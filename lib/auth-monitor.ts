// Tipe data untuk statistik auth
export interface AuthRequestStats {
  timestamp: number
  endpoint: string
  success: boolean
  duration: number
  source: "client" | "middleware" | "server"
  cached: boolean
}

// Tipe data untuk ringkasan statistik
export interface AuthStatsSummary {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  cachedRequests: number
  averageDuration: number
  requestsLast5Min: number
  requestsLast15Min: number
  requestsLast1Hour: number
  requestsLast24Hours: number
}

// Konstanta untuk penyimpanan
const AUTH_STATS_KEY = "auth_monitoring_stats"
const MAX_STORED_REQUESTS = 1000 // Batasi jumlah permintaan yang disimpan
const RATE_LIMIT_THRESHOLD = 0.8 // 80% dari batas rate limit

// Batas rate limit Supabase (sesuaikan dengan paket Anda)
export const RATE_LIMITS = {
  requestsPerMinute: 60,
  requestsPerHour: 1000,
  requestsPerDay: 10000,
}

// Statistik untuk perangkat mobile
let mobileStats: {
  total: number
  success: number
  error: number
  cached: number
} | null = null

// Inisialisasi variabel yang kurang
let authStats: {
  [key: string]: {
    count: number
    totalDuration: number
    lastTimestamp: number
  }
} = {}
let totalRequests = 0
let errorRequests = 0

// Fungsi untuk menyimpan statistik permintaan auth
export function recordAuthRequest(data: {
  endpoint: string
  success: boolean
  duration: number
  source: "client" | "server" | "middleware"
  cached?: boolean
}) {
  // Tambahkan ke statistik
  const key = `${data.endpoint}:${data.success ? "success" : "error"}:${data.source}:${data.cached ? "cached" : "fresh"}`

  // Simpan statistik
  if (!authStats[key]) {
    authStats[key] = {
      count: 0,
      totalDuration: 0,
      lastTimestamp: Date.now(),
    }
  }

  authStats[key].count++
  authStats[key].totalDuration += data.duration
  authStats[key].lastTimestamp = Date.now()

  // Tambahkan ke total
  totalRequests++

  // Tambahkan ke error jika gagal
  if (!data.success) {
    errorRequests++
  }
}

// Fungsi untuk mendapatkan semua statistik
export function getAuthStats(): AuthRequestStats[] {
  try {
    if (typeof localStorage === "undefined") return []
    const statsJson = localStorage.getItem(AUTH_STATS_KEY)
    return statsJson ? JSON.parse(statsJson) : []
  } catch (error) {
    console.error("Error getting auth stats:", error)
    return []
  }
}

// Fungsi untuk mendapatkan statistik mobile
export function getMobileAuthStats() {
  return (
    mobileStats || {
      total: 0,
      success: 0,
      error: 0,
      cached: 0,
    }
  )
}

// Fungsi untuk mendapatkan ringkasan statistik
export function getAuthStatsSummary(): AuthStatsSummary {
  const stats = getAuthStats()
  const now = Date.now()

  // Filter berdasarkan waktu
  const last5Min = stats.filter((s) => s.timestamp > now - 5 * 60 * 1000)
  const last15Min = stats.filter((s) => s.timestamp > now - 15 * 60 * 1000)
  const last1Hour = stats.filter((s) => s.timestamp > now - 60 * 60 * 1000)
  const last24Hours = stats.filter((s) => s.timestamp > now - 24 * 60 * 60 * 1000)

  // Hitung statistik
  const totalRequests = stats.length
  const successfulRequests = stats.filter((s) => s.success).length
  const failedRequests = totalRequests - successfulRequests
  const cachedRequests = stats.filter((s) => s.cached).length

  // Hitung durasi rata-rata
  const totalDuration = stats.reduce((sum, s) => sum + s.duration, 0)
  const averageDuration = totalRequests > 0 ? totalDuration / totalRequests : 0

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    cachedRequests,
    averageDuration,
    requestsLast5Min: last5Min.length,
    requestsLast15Min: last15Min.length,
    requestsLast1Hour: last1Hour.length,
    requestsLast24Hours: last24Hours.length,
  }
}

// Fungsi untuk memeriksa apakah mendekati batas rate limit
function checkRateLimitWarning(stats: AuthRequestStats[]) {
  const now = Date.now()

  // Hitung permintaan dalam interval waktu tertentu
  const lastMinute = stats.filter((s) => s.timestamp > now - 60 * 1000).length
  const lastHour = stats.filter((s) => s.timestamp > now - 60 * 60 * 1000).length
  const lastDay = stats.filter((s) => s.timestamp > now - 24 * 60 * 60 * 1000).length

  // Periksa apakah mendekati batas
  const minuteRatio = lastMinute / RATE_LIMITS.requestsPerMinute
  const hourRatio = lastHour / RATE_LIMITS.requestsPerHour
  const dayRatio = lastDay / RATE_LIMITS.requestsPerDay

  // Tampilkan peringatan jika mendekati batas
  if (minuteRatio > RATE_LIMIT_THRESHOLD) {
    console.warn(
      `⚠️ RATE LIMIT WARNING: ${lastMinute}/${RATE_LIMITS.requestsPerMinute} requests in the last minute (${Math.round(minuteRatio * 100)}%)`,
    )

    // Kirim event untuk UI
    if (typeof window !== "undefined") {
      const event = new CustomEvent("auth-rate-limit-warning", {
        detail: {
          type: "minute",
          current: lastMinute,
          limit: RATE_LIMITS.requestsPerMinute,
          ratio: minuteRatio,
        },
      })
      window.dispatchEvent(event)
    }
  }

  if (hourRatio > RATE_LIMIT_THRESHOLD) {
    console.warn(
      `⚠️ RATE LIMIT WARNING: ${lastHour}/${RATE_LIMITS.requestsPerHour} requests in the last hour (${Math.round(hourRatio * 100)}%)`,
    )

    // Kirim event untuk UI
    if (typeof window !== "undefined") {
      const event = new CustomEvent("auth-rate-limit-warning", {
        detail: {
          type: "hour",
          current: lastHour,
          limit: RATE_LIMITS.requestsPerHour,
          ratio: hourRatio,
        },
      })
      window.dispatchEvent(event)
    }
  }

  if (dayRatio > RATE_LIMIT_THRESHOLD) {
    console.warn(
      `⚠️ RATE LIMIT WARNING: ${lastDay}/${RATE_LIMITS.requestsPerDay} requests in the last day (${Math.round(dayRatio * 100)}%)`,
    )

    // Kirim event untuk UI
    if (typeof window !== "undefined") {
      const event = new CustomEvent("auth-rate-limit-warning", {
        detail: {
          type: "day",
          current: lastDay,
          limit: RATE_LIMITS.requestsPerDay,
          ratio: dayRatio,
        },
      })
      window.dispatchEvent(event)
    }
  }
}

// Fungsi untuk membersihkan statistik
export function clearAuthStats() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(AUTH_STATS_KEY)
  }
}

// Fungsi untuk mengekspor statistik sebagai JSON
export function exportAuthStats(): string {
  const stats = getAuthStats()
  return JSON.stringify(stats, null, 2)
}

// Fungsi untuk mengekspor statistik sebagai CSV
export function exportAuthStatsCSV(): string {
  const stats = getAuthStats()

  // Header CSV
  let csv = "timestamp,endpoint,success,duration,source,cached\n"

  // Tambahkan baris untuk setiap statistik
  stats.forEach((stat) => {
    const row = [
      new Date(stat.timestamp).toISOString(),
      stat.endpoint,
      stat.success ? "true" : "false",
      stat.duration,
      stat.source,
      stat.cached ? "true" : "false",
    ]
    csv += row.join(",") + "\n"
  })

  return csv
}

export function resetAuthStats() {
  authStats = {}
  totalRequests = 0
  errorRequests = 0
  mobileStats = null // Reset mobile stats
}
