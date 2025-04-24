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
          plan_id: string
          status: string
          amount: number
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          plan_id: string
          status?: string
          amount: number
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          plan_id?: string
          status?: string
          amount?: number
          created_at?: string
          user_id?: string
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
