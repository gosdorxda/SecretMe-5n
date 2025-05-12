export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          username: string | null
          email: string
          created_at: string
          updated_at: string
          is_premium: boolean
          premium_expires_at: string | null
          numeric_id: number
          avatar_url: string | null
          bio: string | null
          instagram_url: string | null
          facebook_url: string | null
          linkedin_url: string | null
          twitter_url: string | null
          tiktok_url: string | null
          allow_public_replies: boolean | null
          telegram_id: string | null
          telegram_notifications: boolean | null
          telegram_chat_id: string | null
          notification_channel: string | null
          role: string | null
          last_ip: string | null
          // Kolom WhatsApp dan email telah dihapus dari database
        }
        Insert: {
          id?: string
          name: string
          username?: string | null
          email: string
          created_at?: string
          updated_at?: string
          is_premium?: boolean
          premium_expires_at?: string | null
          numeric_id?: number
          avatar_url?: string | null
          bio?: string | null
          instagram_url?: string | null
          facebook_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          tiktok_url?: string | null
          allow_public_replies?: boolean | null
          telegram_id?: string | null
          telegram_notifications?: boolean | null
          telegram_chat_id?: string | null
          notification_channel?: string | null
          role?: string | null
          last_ip?: string | null
          // Kolom WhatsApp dan email telah dihapus dari database
        }
        Update: {
          id?: string
          name?: string
          username?: string | null
          email?: string
          created_at?: string
          updated_at?: string
          is_premium?: boolean
          premium_expires_at?: string | null
          numeric_id?: number
          avatar_url?: string | null
          bio?: string | null
          instagram_url?: string | null
          facebook_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          tiktok_url?: string | null
          allow_public_replies?: boolean | null
          telegram_id?: string | null
          telegram_notifications?: boolean | null
          telegram_chat_id?: string | null
          notification_channel?: string | null
          role?: string | null
          last_ip?: string | null
          // Kolom WhatsApp dan email telah dihapus dari database
        }
      }
      messages: {
        Row: {
          id: string
          content: string
          created_at: string
          updated_at: string
          user_id: string
          reply: string | null
        }
        Insert: {
          id?: string
          content: string
          created_at?: string
          updated_at?: string
          user_id: string
          reply?: string | null
        }
        Update: {
          id?: string
          content?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          reply?: string | null
        }
      }
      public_replies: {
        Row: {
          id: string
          message_id: string
          content: string
          author_name: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          content: string
          author_name: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          content?: string
          author_name?: string
          created_at?: string
        }
      }
      premium_transactions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          amount: number
          status: string
          payment_method: string | null
          payment_gateway: string | null
          payment_details: Json | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          amount: number
          status?: string
          payment_method?: string | null
          payment_gateway?: string | null
          payment_details?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          amount?: number
          status?: string
          payment_method?: string | null
          payment_gateway?: string | null
          payment_details?: Json | null
          created_at?: string
          updated_at?: string | null
        }
      }
      notification_logs: {
        Row: {
          id: string
          user_id: string
          message_id: string | null
          notification_type: string
          channel: string
          status: string
          created_at: string
          data: Json | null
          error_message: string | null
        }
        Insert: {
          id?: string
          user_id: string
          message_id?: string | null
          notification_type: string
          channel?: string
          status?: string
          created_at?: string
          data?: Json | null
          error_message?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          message_id?: string | null
          notification_type?: string
          channel?: string
          status?: string
          created_at?: string
          data?: Json | null
          error_message?: string | null
        }
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          new_messages: boolean
          message_replies: boolean
          system_updates: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          new_messages?: boolean
          message_replies?: boolean
          system_updates?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          new_messages?: boolean
          message_replies?: boolean
          system_updates?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      profile_views: {
        Row: {
          id: string
          user_id: string
          count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          count?: number
          created_at?: string
          updated_at?: string
        }
      }
      telegram_connection_codes: {
        Row: {
          id: string
          code: string
          user_id: string
          created_at: string
          expires_at: string
          used: boolean
        }
        Insert: {
          id?: string
          code: string
          user_id: string
          created_at?: string
          expires_at: string
          used?: boolean
        }
        Update: {
          id?: string
          code?: string
          user_id?: string
          created_at?: string
          expires_at?: string
          used?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
