// File baru untuk meng-patch Supabase SDK

// Fungsi untuk meng-patch Supabase SDK
export function patchSupabaseSDK() {
  if (typeof window !== "undefined") {
    // Simpan waktu refresh token terakhir
    let lastTokenRefresh = 0
    const MIN_REFRESH_INTERVAL = 300000 // 5 menit

    // Patch fetch global untuk mendeteksi dan throttle token refresh
    const originalFetch = window.fetch
    window.fetch = function patchedFetch(input, init) {
      // Deteksi apakah ini adalah permintaan refresh token
      if (
        typeof input === "string" &&
        input.includes("/auth/v1/token") &&
        init?.body &&
        typeof init.body === "string" &&
        init.body.includes("refresh_token")
      ) {
        const now = Date.now()

        // Jika refresh terlalu sering, throttle
        if (now - lastTokenRefresh < MIN_REFRESH_INTERVAL) {
          console.warn(
            `Token refresh throttled: too frequent (${Math.round((now - lastTokenRefresh) / 1000)}s < ${MIN_REFRESH_INTERVAL / 1000}s)`,
          )

          // Return response palsu untuk mencegah error
          return Promise.resolve(
            new Response(
              JSON.stringify({
                error: "Token refresh too frequent",
                error_description: "Too many refresh attempts",
              }),
              {
                status: 429,
                headers: { "Content-Type": "application/json" },
              },
            ),
          )
        }

        // Update waktu refresh terakhir
        lastTokenRefresh = now
      }

      // Lanjutkan dengan fetch normal
      return originalFetch.apply(this, [input, init])
    }
  }
}
