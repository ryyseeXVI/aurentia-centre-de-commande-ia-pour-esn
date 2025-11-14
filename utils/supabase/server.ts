/**
 * Backward compatibility export for Supabase server client
 *
 * This file re-exports the server client with an alternative function name
 * for backward compatibility with existing code.
 */

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase server client with proper typing
 * @deprecated Use createClient from '@/lib/supabase/server' instead
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient<Database, 'public'>> {
  return createClient();
}

export { createClient };
export type { Database };
