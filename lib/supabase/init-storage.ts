import { createClient } from "@/lib/supabase/server"

export async function initSupabaseStorage() {
  const supabase = createClient()

  try {
    // Periksa apakah bucket 'avatars' sudah ada
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("Error memeriksa buckets:", bucketsError)
      return
    }

    const avatarBucketExists = buckets.some((bucket) => bucket.name === "avatars")

    // Jika bucket belum ada, buat bucket baru
    if (!avatarBucketExists) {
      const { data, error } = await supabase.storage.createBucket("avatars", {
        public: true, // Buat publik agar bisa diakses langsung
        fileSizeLimit: 1024 * 1024 * 2, // Batasi ukuran file (2MB)
        allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
      })

      if (error) {
        console.error("Error membuat bucket avatars:", error)
        return
      }

      console.log("Bucket avatars berhasil dibuat")
    }

    // Atur kebijakan akses publik untuk bucket avatars
    const { error: policyError } = await supabase.storage.from("avatars").getPublicUrl("")

    if (policyError) {
      console.error("Error mengatur kebijakan publik:", policyError)
    }

    console.log("Supabase Storage berhasil diinisialisasi")
  } catch (error) {
    console.error("Error inisialisasi Supabase Storage:", error)
  }
}
