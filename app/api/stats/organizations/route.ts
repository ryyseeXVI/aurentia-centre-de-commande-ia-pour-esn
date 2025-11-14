import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, authenticateUser } from '@/lib/api-helpers'

export async function GET() {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError) {
      return errorResponse('Unauthorized', 401)
    }

    // Count client organizations (exclude ESN organizations)
    const { count, error } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .ilike('description', 'Client:%')

    if (error) {
      console.error('Error fetching organizations count:', error)
      return errorResponse('Failed to fetch organizations count')
    }

    return successResponse({ count: count || 0 })
  } catch (error) {
    console.error('Unexpected error in organizations stats:', error)
    return errorResponse('Internal server error')
  }
}
