import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, authenticateUser } from '@/lib/api-helpers'

export async function GET() {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError) {
      return errorResponse('Unauthorized', 401)
    }

    // Count organizations that the user has access to via user_organizations
    const { data: memberships, error: membershipsError } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)

    if (membershipsError) {
      console.error('Error fetching user organizations:', membershipsError)
      return errorResponse('Failed to fetch user organizations')
    }

    // Return the count of unique organizations the user belongs to
    const count = memberships?.length || 0

    return successResponse({ count })
  } catch (error) {
    console.error('Unexpected error in organizations stats:', error)
    return errorResponse('Internal server error')
  }
}
