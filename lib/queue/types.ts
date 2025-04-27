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
  // New fields for batch processing
  batch_id?: string
  batch_size?: number
  batch_position?: number
  // New fields for performance monitoring
  processing_time?: number
  last_error?: string
  last_processed_at?: string
  // Dynamic priority
  dynamic_priority?: number
}

export interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  retry: number
  total: number
  // New stats
  avg_processing_time?: number
  max_processing_time?: number
  avg_retry_count?: number
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
  batchId?: string
}

export interface ProcessResult {
  success: boolean
  processedCount: number
  error?: string
  batchesProcessed?: number
  processingTime?: number
}

export interface BatchProcessingOptions {
  batchSize: number
  maxBatches: number
  channelConcurrency: Record<string, number>
}

export interface NotificationBatch {
  id: string
  items: NotificationQueueItem[]
  size: number
  channel: string
  createdAt: string
}
