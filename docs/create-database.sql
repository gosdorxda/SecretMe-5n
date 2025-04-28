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
