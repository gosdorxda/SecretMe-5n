# Dokumentasi Database SecretMe

Dokumen ini berisi informasi lengkap tentang struktur database yang digunakan dalam aplikasi SecretMe. Dokumentasi ini dapat digunakan untuk membangun ulang database jika terjadi kerusakan atau untuk migrasi ke platform database lain.

## Daftar Tabel

1. [users](#tabel-users) - Menyimpan data pengguna
2. [messages](#tabel-messages) - Menyimpan pesan yang dikirim ke pengguna
3. [public_replies](#tabel-public_replies) - Menyimpan balasan publik untuk pesan
4. [premium_transactions](#tabel-premium_transactions) - Menyimpan transaksi premium
5. [notification_logs](#tabel-notification_logs) - Menyimpan log notifikasi
6. [profile_views](#tabel-profile_views) - Menyimpan jumlah tampilan profil

## Struktur Tabel

### Tabel: users

Tabel ini menyimpan informasi pengguna aplikasi.

| Kolom | Tipe Data | Nullable | Default | Deskripsi |
|-------|-----------|----------|---------|-----------|
| id | uuid | tidak | uuid_generate_v4() | Primary key |
| name | text | tidak | | Nama pengguna |
| username | text | ya | null | Username unik pengguna |
| email | text | tidak | | Email pengguna |
| created_at | timestamp with time zone | tidak | now() | Waktu pembuatan akun |
| updated_at | timestamp with time zone | tidak | now() | Waktu update terakhir |
| is_premium | boolean | tidak | false | Status premium pengguna |
| premium_expires_at | timestamp with time zone | ya | null | Waktu berakhirnya status premium |
| numeric_id | bigint | tidak | | ID numerik pengguna (auto-increment) |
| avatar_url | text | ya | null | URL avatar pengguna |
| bio | text | ya | null | Biografi pengguna |
| instagram_url | text | ya | null | URL Instagram pengguna |
| facebook_url | text | ya | null | URL Facebook pengguna |
| linkedin_url | text | ya | null | URL LinkedIn pengguna |
| twitter_url | text | ya | null | URL Twitter pengguna |
| tiktok_url | text | ya | null | URL TikTok pengguna |
| allow_public_replies | boolean | ya | true | Izinkan balasan publik |
| phone_number | text | ya | null | Nomor telepon pengguna |
| notification_channel | text | ya | null | Saluran notifikasi pilihan |
| whatsapp_notifications | boolean | ya | false | Status notifikasi WhatsApp |
| telegram_id | text | ya | null | ID Telegram pengguna |
| telegram_notifications | boolean | ya | false | Status notifikasi Telegram |

**Indeks:**
- `users_pkey` - Primary key pada kolom `id`
- `users_username_key` - Unique index pada kolom `username`
- `users_email_key` - Unique index pada kolom `email`
- `users_numeric_id_key` - Unique index pada kolom `numeric_id`

**Constraints:**
- Primary Key: `id`
- Unique: `username`, `email`, `numeric_id`

### Tabel: messages

Tabel ini menyimpan pesan yang dikirim ke pengguna.

| Kolom | Tipe Data | Nullable | Default | Deskripsi |
|-------|-----------|----------|---------|-----------|
| id | uuid | tidak | uuid_generate_v4() | Primary key |
| content | text | tidak | | Isi pesan |
| created_at | timestamp with time zone | tidak | now() | Waktu pembuatan pesan |
| updated_at | timestamp with time zone | tidak | now() | Waktu update terakhir |
| user_id | uuid | tidak | | ID pengguna penerima pesan |
| reply | text | ya | null | Balasan dari pengguna |

**Indeks:**
- `messages_pkey` - Primary key pada kolom `id`
- `messages_user_id_idx` - Index pada kolom `user_id`

**Constraints:**
- Primary Key: `id`
- Foreign Key: `user_id` references `users(id)` on delete cascade

### Tabel: public_replies

Tabel ini menyimpan balasan publik untuk pesan.

| Kolom | Tipe Data | Nullable | Default | Deskripsi |
|-------|-----------|----------|---------|-----------|
| id | uuid | tidak | uuid_generate_v4() | Primary key |
| message_id | uuid | tidak | | ID pesan yang dibalas |
| content | text | tidak | | Isi balasan |
| author_name | text | tidak | | Nama penulis balasan |
| created_at | timestamp with time zone | tidak | now() | Waktu pembuatan balasan |

**Indeks:**
- `public_replies_pkey` - Primary key pada kolom `id`
- `public_replies_message_id_idx` - Index pada kolom `message_id`

**Constraints:**
- Primary Key: `id`
- Foreign Key: `message_id` references `messages(id)` on delete cascade

### Tabel: premium_transactions

Tabel ini menyimpan transaksi premium.

| Kolom | Tipe Data | Nullable | Default | Deskripsi |
|-------|-----------|----------|---------|-----------|
| id | uuid | tidak | uuid_generate_v4() | Primary key |
| user_id | uuid | tidak | | ID pengguna |
| plan_id | text | tidak | | ID paket premium |
| amount | numeric | tidak | | Jumlah pembayaran |
| status | text | tidak | 'pending' | Status transaksi |
| payment_method | text | ya | null | Metode pembayaran |
| payment_gateway | text | ya | null | Gateway pembayaran |
| payment_details | jsonb | ya | null | Detail pembayaran dalam format JSON |
| created_at | timestamp with time zone | tidak | now() | Waktu pembuatan transaksi |
| updated_at | timestamp with time zone | ya | null | Waktu update terakhir |

**Indeks:**
- `premium_transactions_pkey` - Primary key pada kolom `id`
- `premium_transactions_user_id_idx` - Index pada kolom `user_id`

**Constraints:**
- Primary Key: `id`
- Foreign Key: `user_id` references `users(id)` on delete cascade

### Tabel: notification_logs

Tabel ini menyimpan log notifikasi.

| Kolom | Tipe Data | Nullable | Default | Deskripsi |
|-------|-----------|----------|---------|-----------|
| id | uuid | tidak | uuid_generate_v4() | Primary key |
| user_id | uuid | tidak | | ID pengguna |
| message_id | uuid | ya | null | ID pesan terkait |
| notification_type | text | tidak | | Tipe notifikasi |
| channel | text | tidak | 'email' | Saluran notifikasi |
| status | text | tidak | 'pending' | Status notifikasi |
| created_at | timestamp with time zone | tidak | now() | Waktu pembuatan log |
| data | jsonb | ya | null | Data tambahan dalam format JSON |
| error_message | text | ya | null | Pesan error jika ada |

**Indeks:**
- `notification_logs_pkey` - Primary key pada kolom `id`
- `notification_logs_user_id_idx` - Index pada kolom `user_id`
- `notification_logs_message_id_idx` - Index pada kolom `message_id`

**Constraints:**
- Primary Key: `id`
- Foreign Key: `user_id` references `users(id)` on delete cascade
- Foreign Key: `message_id` references `messages(id)` on delete set null

### Tabel: profile_views

Tabel ini menyimpan jumlah tampilan profil.

| Kolom | Tipe Data | Nullable | Default | Deskripsi |
|-------|-----------|----------|---------|-----------|
| id | uuid | tidak | uuid_generate_v4() | Primary key |
| user_id | uuid | tidak | | ID pengguna |
| count | integer | tidak | 0 | Jumlah tampilan |
| created_at | timestamp with time zone | tidak | now() | Waktu pembuatan record |
| updated_at | timestamp with time zone | tidak | now() | Waktu update terakhir |

**Indeks:**
- `profile_views_pkey` - Primary key pada kolom `id`
- `profile_views_user_id_key` - Unique index pada kolom `user_id`

**Constraints:**
- Primary Key: `id`
- Unique: `user_id`
- Foreign Key: `user_id` references `users(id)` on delete cascade

## Script SQL untuk Membuat Database

Berikut adalah script SQL untuk membuat seluruh struktur database:

\`\`\`sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    username TEXT UNIQUE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    premium_expires_at TIMESTAMPTZ,
    numeric_id BIGSERIAL UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    instagram_url TEXT,
    facebook_url TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    tiktok_url TEXT,
    allow_public_replies BOOLEAN DEFAULT TRUE,
    phone_number TEXT,
    notification_channel TEXT,
    whatsapp_notifications BOOLEAN DEFAULT FALSE,
    telegram_id TEXT,
    telegram_notifications BOOLEAN DEFAULT FALSE
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reply TEXT
);
CREATE INDEX messages_user_id_idx ON messages(user_id);

-- Create public_replies table
CREATE TABLE public_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX public_replies_message_id_idx ON public_replies(message_id);

-- Create premium_transactions table
CREATE TABLE premium_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    payment_gateway TEXT,
    payment_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
CREATE INDEX premium_transactions_user_id_idx ON premium_transactions(user_id);

-- Create notification_logs table
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    notification_type TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'email',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data JSONB,
    error_message TEXT
);
CREATE INDEX notification_logs_user_id_idx ON notification_logs(user_id);
CREATE INDEX notification_logs_message_id_idx ON notification_logs(message_id);

-- Create profile_views table
CREATE TABLE profile_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create telegram_connection_codes table
CREATE TABLE telegram_connection_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX telegram_connection_codes_user_id_idx ON telegram_connection_codes(user_id);
CREATE INDEX telegram_connection_codes_code_idx ON telegram_connection_codes(code);

-- Create site_config table
CREATE TABLE site_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payment_notification_logs table
CREATE TABLE payment_notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES premium_transactions(id) ON DELETE SET NULL,
    gateway TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sitemap_logs table
CREATE TABLE sitemap_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
\`\`\`

## Trigger dan Fungsi

### Trigger untuk Update Timestamp

\`\`\`sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to messages table
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to premium_transactions table
CREATE TRIGGER update_premium_transactions_updated_at
BEFORE UPDATE ON premium_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to profile_views table
CREATE TRIGGER update_profile_views_updated_at
BEFORE UPDATE ON profile_views
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to site_config table
CREATE TRIGGER update_site_config_updated_at
BEFORE UPDATE ON site_config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
\`\`\`

### Trigger untuk Notifikasi

\`\`\`sql
-- Function to create notification when a new message is received
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_logs (
        user_id,
        message_id,
        notification_type,
        channel,
        status
    ) VALUES (
        NEW.user_id,
        NEW.id,
        'new_message',
        COALESCE((SELECT notification_channel FROM users WHERE id = NEW.user_id), 'email'),
        'pending'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to messages table
CREATE TRIGGER create_message_notification_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION create_message_notification();
\`\`\`

## Catatan Penting

1. **Backup Reguler**: Lakukan backup database secara reguler untuk mencegah kehilangan data.
2. **Migrasi**: Gunakan script ini sebagai dasar untuk migrasi ke platform database lain.
3. **Indeks**: Indeks telah ditambahkan untuk meningkatkan performa query, namun mungkin perlu disesuaikan berdasarkan pola akses.
4. **Keamanan**: Pastikan untuk menerapkan kebijakan keamanan yang tepat pada level database.
5. **Pemeliharaan**: Lakukan VACUUM dan ANALYZE secara berkala untuk memelihara performa database.

## Diagram Relasi

\`\`\`
users
 ├── messages (user_id)
 ├── public_replies (via messages)
 ├── premium_transactions (user_id)
 ├── notification_logs (user_id)
 ├── profile_views (user_id)
 └── telegram_connection_codes (user_id)
\`\`\`

## Prosedur Pemulihan

Jika terjadi kerusakan database, ikuti langkah-langkah berikut:

1. Buat database baru di Supabase atau platform lain
2. Jalankan script SQL untuk membuat struktur tabel
3. Jalankan script SQL untuk membuat trigger dan fungsi
4. Pulihkan data dari backup terakhir jika tersedia
5. Verifikasi integritas data dengan menjalankan query validasi
6. Update konfigurasi aplikasi untuk menghubungkan ke database baru

## Kontak

Untuk pertanyaan atau bantuan terkait database, hubungi tim pengembangan di [email@example.com].
