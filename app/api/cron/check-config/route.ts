import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const providedSecret = searchParams.get("secret") || ""
    const envSecret = process.env.CRON_SECRET || ""

    // Fungsi untuk memeriksa apakah secret dikonfigurasi
    const isConfigured = (secret: string) => !!secret && secret.length > 0

    // Fungsi untuk memeriksa apakah dua secret cocok
    const doSecretsMatch = (secret1: string, secret2: string) =>
      isConfigured(secret1) && isConfigured(secret2) && secret1 === secret2

    return NextResponse.json({
      success: true,
      config: {
        cronSecretConfigured: isConfigured(envSecret),
        providedSecretMatches: doSecretsMatch(providedSecret, envSecret),
      },
    })
  } catch (error) {
    console.error("Error checking cron configuration:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
