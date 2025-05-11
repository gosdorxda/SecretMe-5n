export interface UserNotificationSettings {
  id: string
  user_id: string
  enabled: boolean
  channel_type: "none" | "telegram" | "whatsapp" | "email"
  telegram_id: string | null
  notify_new_messages: boolean
  notify_replies: boolean
  notify_system_updates: boolean
  created_at: string
  updated_at: string
}

export interface NotificationSettingsFormData {
  enabled: boolean
  channel_type: "none" | "telegram" | "whatsapp" | "email"
  notify_new_messages: boolean
  notify_replies: boolean
  notify_system_updates: boolean
}
