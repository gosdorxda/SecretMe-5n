import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getVerifiedUser, isAdmin } from "@/lib/supabase/server"

export async function GET() {
  try {
    // Verifikasi bahwa pengguna adalah admin
    const { user, error } = await getVerifiedUser()

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdminUser = await isAdmin(user.id)

    if (!isAdminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const supabase = createClient()

    // Cek apakah bucket avatars sudah ada
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json({ error: bucketsError.message }, { status: 500 })
    }

    const avatarBucket = buckets.find((bucket) => bucket.name === "avatars")

    // Jika bucket belum ada, buat bucket baru
    if (!avatarBucket) {
      const { error: createError } = await supabase.storage.createBucket("avatars", {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024, // 2MB
      })

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Storage setup completed",
      bucketExists: !!avatarBucket,
    })
  } catch (error) {
    console.error("Error setting up storage:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
