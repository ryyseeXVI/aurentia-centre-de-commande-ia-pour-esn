export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          nom: string
          prenom: string
          role: 'ADMIN' | 'MANAGER' | 'CONSULTANT' | 'CLIENT'
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nom: string
          prenom: string
          role?: 'ADMIN' | 'MANAGER' | 'CONSULTANT' | 'CLIENT'
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nom?: string
          prenom?: string
          role?: 'ADMIN' | 'MANAGER' | 'CONSULTANT' | 'CLIENT'
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add other table types as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<string, never>
        Returns: 'ADMIN' | 'MANAGER' | 'CONSULTANT' | 'CLIENT'
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_manager_or_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: 'ADMIN' | 'MANAGER' | 'CONSULTANT' | 'CLIENT'
    }
  }
}
