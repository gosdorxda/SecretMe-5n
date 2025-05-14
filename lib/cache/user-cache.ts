/**
 * User Cache
 *
 * Modul ini menyediakan fungsi untuk caching data user
 * untuk mengurangi query database yang berulang.
 */

type CachedUser = {
  id: string
  name: string
  username: string | null
  is_premium: boolean
  numeric_id: number
  telegram_notifications?: boolean
  telegram_id?: string
}

// Cache untuk data user berdasarkan ID
const userCache = new Map<string, { user: CachedUser; expiry: number }>()

// Durasi cache dalam milidetik
const USER_CACHE_DURATION = 5 * 60 * 1000 // 5 menit

/**
 * Mendapatkan data user dari cache atau database
 */
export async function getCachedUser(supabase: any, userId: string): Promise<CachedUser | null> {
  const now = Date.now()

  // Cek cache
  const cachedData = userCache.get(userId)
  if (cachedData && now < cachedData.expiry) {
    console.log("Using cached user data for:", userId)
    return cachedData.user
  }

  // Ambil dari database jika tidak ada di cache
  console.log("Fetching user data from database for:", userId)
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user data:", error)
    return null
  }

  // Konversi data ke format yang dibutuhkan
  const user: CachedUser = {
    id: data.id,
    name: data.name,
    username: data.username,
    is_premium: data.is_premium,
    numeric_id: data.numeric_id,
    telegram_notifications: data.telegram_notifications,
    telegram_id: data.telegram_id,
  }

  // Update cache
  userCache.set(userId, {
    user,
    expiry: now + USER_CACHE_DURATION,
  })

  return user
}

/**
 * Invalidasi cache untuk user tertentu
 */
export function invalidateUserCache(userId: string): void {
  userCache.delete(userId)
}

/**
 * Perbarui cache user jika sudah ada di cache
 */
export function updateUserCacheIfExists(userId: string, userData: Partial<CachedUser>): void {
  const cachedData = userCache.get(userId)
  if (cachedData) {
    const updatedUser = { ...cachedData.user, ...userData }
    userCache.set(userId, {
      user: updatedUser,
      expiry: cachedData.expiry,
    })
  }
}
