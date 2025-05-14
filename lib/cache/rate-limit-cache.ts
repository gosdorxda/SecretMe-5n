/**
 * Rate Limit Cache
 *
 * Modul ini menyediakan fungsi untuk caching konfigurasi rate limit
 * dan status rate limit untuk mengurangi query database yang berulang.
 */

type RateLimitConfig = {
  max_messages_per_day: number
  max_messages_per_hour: number
  block_duration_hours: number
  updated_at: string
}

type RateLimitStatus = {
  allowed: boolean
  attempt_count: number
  first_attempt: string
  last_attempt: string
  is_blocked: boolean
  expires_at?: string
}

// Cache untuk konfigurasi rate limit
let configCache: RateLimitConfig | null = null
let configCacheExpiry = 0

// Cache untuk status rate limit berdasarkan IP dan recipient
const statusCache = new Map<string, { status: RateLimitStatus; expiry: number }>()

// Durasi cache dalam milidetik
const CONFIG_CACHE_DURATION = 5 * 60 * 1000 // 5 menit
const STATUS_CACHE_DURATION = 30 * 1000 // 30 detik

/**
 * Mendapatkan konfigurasi rate limit dari cache atau database
 */
export async function getCachedRateLimitConfig(supabase: any): Promise<RateLimitConfig> {
  const now = Date.now()

  // Jika cache masih valid, gunakan cache
  if (configCache && now < configCacheExpiry) {
    console.log("Using cached rate limit config")
    return configCache
  }

  // Jika cache tidak valid, ambil dari database
  console.log("Fetching rate limit config from database")
  const { data, error } = await supabase
    .from("rate_limit_config")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error("Error fetching rate limit config:", error)
    // Jika ada error, gunakan cache lama jika ada
    if (configCache) {
      return configCache
    }

    // Jika tidak ada cache, gunakan nilai default
    return {
      max_messages_per_day: 5,
      max_messages_per_hour: 2,
      block_duration_hours: 24,
      updated_at: new Date().toISOString(),
    }
  }

  // Update cache dan expiry time
  configCache = data
  configCacheExpiry = now + CONFIG_CACHE_DURATION

  return data
}

/**
 * Mendapatkan status rate limit dari cache atau database
 */
export async function getCachedRateLimitStatus(
  supabase: any,
  ip: string,
  recipientId: string,
): Promise<RateLimitStatus | null> {
  const cacheKey = `${ip}:${recipientId}`
  const now = Date.now()

  // Cek cache
  const cachedData = statusCache.get(cacheKey)
  if (cachedData && now < cachedData.expiry) {
    console.log("Using cached rate limit status")
    return cachedData.status
  }

  // Ambil dari database jika tidak ada di cache
  console.log("Fetching rate limit status from database")
  const { data, error } = await supabase
    .from("message_rate_limits")
    .select("*")
    .eq("ip_address", ip)
    .eq("recipient_id", recipientId)
    .order("last_attempt", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("Error fetching rate limit status:", error)
    return null
  }

  if (!data) {
    return null
  }

  // Konversi data ke format status
  const status: RateLimitStatus = {
    allowed: !data.is_blocked,
    attempt_count: data.attempt_count,
    first_attempt: data.first_attempt,
    last_attempt: data.last_attempt,
    is_blocked: data.is_blocked,
  }

  // Tambahkan expiry time jika diblokir
  if (data.is_blocked) {
    const blockEndTime = new Date(data.last_attempt)
    const config = await getCachedRateLimitConfig(supabase)
    blockEndTime.setHours(blockEndTime.getHours() + config.block_duration_hours)
    status.expires_at = blockEndTime.toISOString()
  }

  // Update cache
  statusCache.set(cacheKey, {
    status,
    expiry: now + STATUS_CACHE_DURATION,
  })

  return status
}

/**
 * Invalidasi cache status untuk IP dan recipient tertentu
 */
export function invalidateRateLimitStatus(ip: string, recipientId: string): void {
  const cacheKey = `${ip}:${recipientId}`
  statusCache.delete(cacheKey)
}

/**
 * Invalidasi seluruh cache konfigurasi
 */
export function invalidateConfigCache(): void {
  configCache = null
  configCacheExpiry = 0
}
