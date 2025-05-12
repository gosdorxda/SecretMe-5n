-- Membuat bucket avatars jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Membuat kebijakan untuk mengizinkan akses publik ke bucket avatars
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Membuat kebijakan untuk mengizinkan pengguna terautentikasi mengupload file ke folder public
CREATE POLICY "Allow authenticated uploads to public folder" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'public'
);

-- Membuat kebijakan untuk mengizinkan pengguna terautentikasi menghapus file mereka sendiri
CREATE POLICY "Allow users to delete their own avatars" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'public' AND
  name LIKE '%' || auth.uid() || '%'
);
