/**
 * Backward compatibility export for Supabase browser client
 *
 * This file re-exports the browser client with an alternative function name
 * for backward compatibility with existing code.
 */

import { createClient } from '@/lib/supabase/client';

export const createBrowserSupabaseClient = createClient;
export { createClient };
