-- Periksa apakah kolom notification_channel sudah ada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'notification_channel'
    ) THEN
        -- Tambahkan kolom notification_channel
        ALTER TABLE users ADD COLUMN notification_channel TEXT;
        
        -- Update pengguna yang sudah memiliki telegram_chat_id
        UPDATE users
        SET notification_channel = 'telegram'
        WHERE telegram_chat_id IS NOT NULL;
    END IF;
END $$;

-- Periksa apakah kolom telegram_chat_id sudah ada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'telegram_chat_id'
    ) THEN
        -- Tambahkan kolom telegram_chat_id
        ALTER TABLE users ADD COLUMN telegram_chat_id TEXT;
    END IF;
END $$;

-- Buat tabel telegram_verification jika belum ada
CREATE TABLE IF NOT EXISTS telegram_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
    UNIQUE(code)
);

-- Buat fungsi untuk mendapatkan kolom tabel
CREATE OR REPLACE FUNCTION get_table_columns(table_name TEXT)
RETURNS TEXT[] AS $$
DECLARE
    columns TEXT[];
BEGIN
    SELECT array_agg(column_name::TEXT)
    INTO columns
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = $1;
    
    RETURN columns;
END;
$$ LANGUAGE plpgsql;

-- Buat fungsi untuk mendapatkan daftar tabel
CREATE OR REPLACE FUNCTION list_tables()
RETURNS TEXT[] AS $$
DECLARE
    tables TEXT[];
BEGIN
    SELECT array_agg(table_name::TEXT)
    INTO tables
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
    
    RETURN tables;
END;
$$ LANGUAGE plpgsql;
