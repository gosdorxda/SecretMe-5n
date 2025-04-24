-- Ubah nilai default kolom allow_public_replies menjadi false
ALTER TABLE users ALTER COLUMN allow_public_replies SET DEFAULT false;

-- Update pengguna yang belum memiliki nilai allow_public_replies yang ditetapkan (NULL)
-- menjadi false juga
UPDATE users SET allow_public_replies = false WHERE allow_public_replies IS NULL;
