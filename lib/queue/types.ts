export interface NotificationQueueItem {
  id: string
  user_id: string
  message_id?: string
  notification_type: string
  channel: "telegram" | "whatsapp" | "email" | "in_app"
  payload: Record<string, any>
  status: "pending" | "processing" | "completed" | "failed" | "retry"
  priority: number
  dynamic_priority?: number
  created_at: string
  updated_at: string
  max_retries: number
  retry_count: number
  next_retry_at?: string
  error_message?: string
  last_error?: string
  processing_time?: number
  last_processed_at?: string
  batch_id?: string
  batch_size?: number
  batch_position?: number
}

export interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  retry: number
  total: number
  avg_processing_time?: number
  max_processing_time?: number
  avg_retry_count?: number
}

export interface NotificationBatch {
  id: string
  items: NotificationQueueItem[]
  size: number
  channel: "telegram" | "whatsapp" | "email" | "in_app"
  createdAt: string
}

export interface ProcessingResult {
  success: boolean
  id: string
  error?: string
  processingTime?: number
}

export interface BatchProcessingResult {
  batchId: string
  results: ProcessingResult[]
  successCount: number
  failureCount: number
  totalProcessingTime: number
  averageProcessingTime: number
}
