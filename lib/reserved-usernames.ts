// Daftar username yang tidak boleh digunakan (reserved)
export const RESERVED_USERNAMES = [
  // Rute aplikasi
  "about",
  "admin",
  "api",
  "auth",
  "blog",
  "contact",
  "dashboard",
  "features",
  "forgot-password",
  "giveaway",
  "help",
  "login",
  "logout",
  "premium",
  "privacy",
  "register",
  "reset-password",
  "settings",
  "statistics",
  "status",
  "support",
  "terms",
  "verify",

  // Kata-kata umum yang mungkin digunakan di masa depan
  "home",
  "index",
  "main",
  "app",
  "user",
  "users",
  "profile",
  "profiles",
  "account",
  "accounts",
  "admin",
  "administrator",
  "root",
  "system",

  // Nama brand
  "secretme",
  "secret",
  "me",
  "admin",
  "moderator",
  "mod",
  "staff",
  "team",
  "official",
  "support",
  "help",

  // Kata-kata yang tidak pantas (tambahkan sesuai kebutuhan)
  "fuck",
  "sex",
  "porn",
  // ... tambahkan kata-kata lain yang tidak pantas
]

/**
 * Memeriksa apakah username adalah reserved username
 * @param username Username yang akan diperiksa
 * @returns true jika username adalah reserved username
 */
export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.includes(username.toLowerCase())
}
