-- Buat tabel site_config jika belum ada
CREATE TABLE IF NOT EXISTS site_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL UNIQUE,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tambahkan pengaturan premium default jika belum ada
INSERT INTO site_config (type, config) 
VALUES (
  'premium_settings', 
  '{
    "price": 49000,
    "enabled": true,
    "description": "Akses ke semua fitur premium selamanya",
    "features": [
      "Tidak ada batasan pesan",
      "Tema premium",
      "Fitur analitik lanjutan",
      "Prioritas dukungan pelanggan"
    ]
  }'
)
ON CONFLICT (type) DO NOTHING;
