export interface NotificationQueueItem {
  id: string
  user_id: string
  message_id?: string
  notification_type: string
  channel: "telegram" | "whatsapp" | "email" | "in_app"
  payload: Record<string, any>
  status: "pending" | "processing" | "completed" | "failed" | "retry"
  priority: number
  retry_count: number
  max_retries: number
  next_retry_at?: string
  error_message?: string
  created_at: string
  updated_at: string
}

export interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  retry: number
  total: number
}

export interface TelegramNotificationPayload {
  messageId?: string
  chatId: string
  text: string
  parseMode?: "HTML" | "Markdown" | "MarkdownV2"
  [key: string]: any
}

export interface EnqueueOptions {
  priority?: number
  maxRetries?: number
}

export interface ProcessResult {
  success: boolean
  processedCount: number
  error?: string
}
