export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          created_at?: string
          title: string
          start_time: string
          end_time: string
          description?: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          start_time: string
          end_time: string
          description?: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          start_time?: string
          end_time?: string
          description?: string
          user_id?: string
        }
      }
      // Add other tables here as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
  }
} 