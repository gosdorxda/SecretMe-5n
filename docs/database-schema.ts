/**
 * TypeScript representation of the SecretMe database schema
 * This file provides type definitions for all tables in the database
 */

export interface User {
  id: string // UUID
  name: string
  username: string | null
  email: string
  created_at: string // ISO date string
  updated_at: string // ISO date string
  is_premium: boolean
  premium_expires_at: string | null // ISO date string
  numeric_id: number
  avatar_url: string | null
  bio: string | null
  instagram_url: string | null
  facebook_url: string | null
  linkedin_url: string | null
  twitter_url: string | null
  tiktok_url: string | null
  allow_public_replies: boolean | null
  phone_number: string | null
  notification_channel: string | null
  whatsapp_notifications: boolean | null
  telegram_id: string | null
  telegram_notifications: boolean | null
}

export interface Message {
  id: string // UUID
  content: string
  created_at: string // ISO date string
  updated_at: string // ISO date string
  user_id: string // UUID, references User.id
  reply: string | null
}

export interface PublicReply {
  id: string // UUID
  message_id: string // UUID, references Message.id
  content: string
  author_name: string
  created_at: string // ISO date string
}

export interface PremiumTransaction {
  id: string // UUID
  user_id: string // UUID, references User.id
  plan_id: string
  amount: number
  status: string
  payment_method: string | null
  payment_gateway: string | null
  payment_details: any | null // JSON object
  created_at: string // ISO date string
  updated_at: string | null // ISO date string
}

export interface NotificationLog {
  id: string // UUID
  user_id: string // UUID, references User.id
  message_id: string | null // UUID, references Message.id
  notification_type: string
  channel: string
  status: string
  created_at: string // ISO date string
  data: any | null // JSON object
  error_message: string | null
}

export interface ProfileView {
  id: string // UUID
  user_id: string // UUID, references User.id
  count: number
  created_at: string // ISO date string
  updated_at: string // ISO date string
}

export interface TelegramConnectionCode {
  id: string // UUID
  user_id: string // UUID, references User.id
  code: string
  created_at: string // ISO date string
  expires_at: string // ISO date string
  used: boolean
}

export interface SiteConfig {
  id: string // UUID
  key: string
  value: any // JSON object
  created_at: string // ISO date string
  updated_at: string // ISO date string
}

export interface PaymentNotificationLog {
  id: string // UUID
  transaction_id: string | null // UUID, references PremiumTransaction.id
  gateway: string
  payload: any // JSON object
  status: string
  created_at: string // ISO date string
}

export interface SitemapLog {
  id: string // UUID
  type: string
  status: string
  details: any | null // JSON object
  created_at: string // ISO date string
}

/**
 * Database schema representation
 */
export interface Database {
  users: User[]
  messages: Message[]
  public_replies: PublicReply[]
  premium_transactions: PremiumTransaction[]
  notification_logs: NotificationLog[]
  profile_views: ProfileView[]
  telegram_connection_codes: TelegramConnectionCode[]
  site_config: SiteConfig[]
  payment_notification_logs: PaymentNotificationLog[]
  sitemap_logs: SitemapLog[]
}
