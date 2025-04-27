export interface NotificationQueueItem {
  id: string
  user_id: string
  message_id?: string
  notification_type: string
  channel: string
  payload: any
  status: string
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
  [key: string]: number
}

export interface EnqueueOptions {
  priority?: number
  maxRetries?: number
  delaySeconds?: number
}

export interface TelegramNotificationPayload {
  chatId: string | number
  text: string
  parseMode?: "HTML" | "Markdown" | "MarkdownV2"
  disableWebPagePreview?: boolean
  disableNotification?: boolean
  replyToMessageId?: number
  [key: string]: any
}

export interface WhatsAppNotificationPayload {
  phoneNumber: string
  message: string
  templateName?: string
  templateParams?: Record<string, string>
  [key: string]: any
}

export interface EmailNotificationPayload {
  to: string
  subject: string
  body: string
  isHtml?: boolean
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
  [key: string]: any
}
