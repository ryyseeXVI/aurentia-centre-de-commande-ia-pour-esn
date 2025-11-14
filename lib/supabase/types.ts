/**
 * Supabase Database Types
 *
 * This file contains TypeScript type definitions for the Supabase database schema.
 *
 * To regenerate these types from your Supabase project:
 * npx supabase gen types typescript --project-id=<your-project-id> > lib/supabase/types.ts
 *
 * Note: This is a minimal placeholder. Regenerate with actual schema for full type safety.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: Record<string, any>
    Views: Record<string, any>
    Functions: Record<string, any>
    Enums: Record<string, any>
    CompositeTypes: Record<string, any>
  }
}
