import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, authenticateUser } from '@/lib/api-helpers'

export async function GET() {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError) {
      return errorResponse('Unauthorized', 401)
    }

    // Count active consultants (status = 'ACTIF')
    const { count, error } = await supabase
      .from('consultant')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'ACTIF')

    if (error) {
      console.error('Error fetching consultants count:', error)
      return errorResponse('Failed to fetch consultants count')
    }

    return successResponse({ count: count || 0 })
  } catch (error) {
    console.error('Unexpected error in consultants stats:', error)
    return errorResponse('Internal server error')
  }
}
